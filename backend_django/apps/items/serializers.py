import json
from django.utils.timesince import timesince
from rest_framework import serializers
from .models import Item, ItemMedia, ItemTag, MatchResult


class ItemMediaSerializer(serializers.ModelSerializer):
    mediaType = serializers.CharField(source="media_type")
    mediaUrl = serializers.SerializerMethodField()

    class Meta:
        model = ItemMedia
        fields = ["mediaType", "mediaUrl", "is_primary", "sort_order"]

    def get_mediaUrl(self, obj):
        request = self.context.get("request")
        if not obj.media_file:
            return ""
        return request.build_absolute_uri(obj.media_file.url) if request else obj.media_file.url


class ItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    mediaType = serializers.SerializerMethodField()
    mediaUrl = serializers.SerializerMethodField()
    reportedBy = serializers.SerializerMethodField()
    location = serializers.CharField(source="location_text")
    timeAgo = serializers.SerializerMethodField()
    helpfulCount = serializers.SerializerMethodField()
    detailsCount = serializers.SerializerMethodField()
    shareCount = serializers.SerializerMethodField()
    verificationStatus = serializers.CharField(source="verification_status")
    userTrustLevel = serializers.CharField(source="reporter.trust_level")
    authenticityDetail = serializers.CharField(source="authenticity_detail")
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            "id",
            "status",
            "mediaType",
            "mediaUrl",
            "title",
            "description",
            "tags",
            "reportedBy",
            "location",
            "timeAgo",
            "helpfulCount",
            "detailsCount",
            "shareCount",
            "verificationStatus",
            "userTrustLevel",
            "authenticityDetail",
            "category",
            "visibility_scope",
            "feature_data",
            "ai_suggested_category",
            "latitude",
            "longitude",
        ]

    def get_mediaType(self, obj):
        media = obj.media.order_by("sort_order", "id").first()
        return media.media_type if media else "image"

    def get_mediaUrl(self, obj):
        media = obj.media.order_by("sort_order", "id").first()
        if not media or not media.media_file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(media.media_file.url) if request else media.media_file.url

    def get_reportedBy(self, obj):
        return obj.reporter.full_name

    def get_timeAgo(self, obj):
        return f"{timesince(obj.created_at)} ago"

    def get_helpfulCount(self, obj):
        return str(obj.helpful_count)

    def get_detailsCount(self, obj):
        return str(obj.details_count)

    def get_shareCount(self, obj):
        return str(obj.share_count)

    def get_tags(self, obj):
        return [t.tag for t in obj.tags.all()]


class ItemCreateSerializer(serializers.Serializer):
    itemType = serializers.ChoiceField(choices=["lost", "found"])
    title = serializers.CharField(max_length=180)
    category = serializers.CharField(max_length=64)
    location = serializers.CharField(max_length=240)
    dateTime = serializers.DateTimeField()
    description = serializers.CharField(required=False, allow_blank=True)
    authenticityDetail = serializers.CharField()
    tags = serializers.CharField(required=False, allow_blank=True)
    scope = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    featureData = serializers.CharField(required=False, allow_blank=True)
    image = serializers.FileField(required=False)
    video = serializers.FileField(required=False)

    def validate(self, attrs):
        status = "FOUND" if attrs["itemType"].lower() == "found" else "LOST"
        image = attrs.get("image")
        video = attrs.get("video")
        if status == "FOUND" and (not image or not video):
            raise serializers.ValidationError("Found items require both image and video proof.")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        raw_feature_data = validated_data.get("featureData") or "{}"

        try:
            feature_data = json.loads(raw_feature_data)
        except json.JSONDecodeError:
            feature_data = {}

        item = Item.objects.create(
            reporter=request.user,
            status="FOUND" if validated_data["itemType"].lower() == "found" else "LOST",
            category=validated_data["category"],
            title=validated_data["title"],
            description=validated_data.get("description", ""),
            location_text=validated_data["location"],
            incident_at=validated_data["dateTime"],
            visibility_scope=validated_data.get("scope") or "nearby",
            authenticity_detail=validated_data["authenticityDetail"],
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            feature_data=feature_data,
        )

        tags_raw = validated_data.get("tags", "")
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if isinstance(tags_raw, str) else []
        for tag in tags[:10]:
            ItemTag.objects.create(item=item, tag=tag)

        image = validated_data.get("image")
        video = validated_data.get("video")

        if image:
            ItemMedia.objects.create(item=item, media_type="image", media_file=image, is_primary=(item.status != "FOUND"), sort_order=2 if item.status == "FOUND" else 1)
        if video:
            ItemMedia.objects.create(item=item, media_type="video", media_file=video, is_primary=(item.status == "FOUND"), sort_order=1)

        return item


class MatchSerializer(serializers.ModelSerializer):
    lostItemId = serializers.IntegerField(source="lost_item_id")
    foundItemId = serializers.IntegerField(source="found_item_id")
    similarityScore = serializers.DecimalField(max_digits=5, decimal_places=2, source="similarity_score")
    feedbackStatus = serializers.CharField(source="feedback_status")
    resolvedAt = serializers.DateTimeField(source="resolved_at", allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at")
    lostItem = ItemSerializer(source="lost_item", read_only=True)
    foundItem = ItemSerializer(source="found_item", read_only=True)

    class Meta:
        model = MatchResult
        fields = [
            "id",
            "lostItemId",
            "foundItemId",
            "similarityScore",
            "is_auto_notified",
            "is_resolved",
            "feedbackStatus",
            "resolvedAt",
            "createdAt",
            "lostItem",
            "foundItem",
        ]
