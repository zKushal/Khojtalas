from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from apps.accounts.permissions import IsAdminRole
from apps.matching.services import run_auto_match_for_item, suggest_category_from_description
from .models import Item, MatchResult
from .serializers import ItemCreateSerializer, ItemSerializer, MatchSerializer


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def items_endpoint(request):
    if request.method == "GET":
        queryset = Item.objects.filter(verification_status="verified").select_related("reporter").prefetch_related("media", "tags").order_by("-created_at")

        category = request.query_params.get("category")
        tag = request.query_params.get("tag")

        if category:
            queryset = queryset.filter(category__iexact=category)
        if tag:
            queryset = queryset.filter(tags__tag__iexact=tag)

        data = ItemSerializer(queryset.distinct(), many=True, context={"request": request}).data
        return Response({"success": True, "items": data})

    if not request.user.is_authenticated or request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = ItemCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    item = serializer.save()

    if not item.ai_suggested_category and item.description:
        item.ai_suggested_category = suggest_category_from_description(item.description)
        item.save(update_fields=["ai_suggested_category"])

    if item.verification_status == "verified":
        run_auto_match_for_item(item)

    return Response(
        {
            "success": True,
            "message": "Item submitted successfully and is now under review.",
            "itemId": item.id,
            "aiSuggestedCategory": item.ai_suggested_category,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_items(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    queryset = Item.objects.filter(reporter=request.user).select_related("reporter").prefetch_related("media", "tags").order_by("-created_at")
    data = ItemSerializer(queryset, many=True, context={"request": request}).data
    return Response({"success": True, "items": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_ai_matches(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    qs = (
        MatchResult.objects.filter(lost_item__reporter=request.user)
        .select_related("lost_item", "found_item", "lost_item__reporter", "found_item__reporter")
        .prefetch_related("lost_item__media", "lost_item__tags", "found_item__media", "found_item__tags")
        .order_by("-created_at")
    )
    data = MatchSerializer(qs, many=True, context={"request": request}).data
    return Response({"success": True, "matches": data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_match_recovered(request, match_id: int):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    try:
        match = MatchResult.objects.select_related("lost_item").get(id=match_id)
    except MatchResult.DoesNotExist:
        return Response({"success": False, "message": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

    if match.lost_item.reporter_id != request.user.id:
        return Response({"success": False, "message": "You cannot update this match."}, status=status.HTTP_403_FORBIDDEN)

    match.is_resolved = True
    match.feedback_status = "recovered"
    match.resolved_at = timezone.now()
    match.save(update_fields=["is_resolved", "feedback_status", "resolved_at"])

    return Response({"success": True, "message": "Match marked as recovered.", "matchId": match.id})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_match_incorrect(request, match_id: int):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    try:
        match = MatchResult.objects.select_related("lost_item").get(id=match_id)
    except MatchResult.DoesNotExist:
        return Response({"success": False, "message": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

    if match.lost_item.reporter_id != request.user.id:
        return Response({"success": False, "message": "You cannot update this match."}, status=status.HTTP_403_FORBIDDEN)

    match.feedback_status = "incorrect"
    match.save(update_fields=["feedback_status"])

    return Response({"success": True, "message": "Match flagged as incorrect.", "matchId": match.id})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_admin_items(request):
    verification_status = request.query_params.get("verificationStatus")
    status_param = request.query_params.get("status")
    limit_param = request.query_params.get("limit")

    qs = Item.objects.select_related("reporter").prefetch_related("media").order_by("-created_at")
    if verification_status:
        qs = qs.filter(verification_status=verification_status)
    if status_param:
        qs = qs.filter(status=status_param)
    if limit_param and str(limit_param).isdigit():
        qs = qs[: max(1, int(limit_param))]

    items = []
    for item in qs:
        media = item.media.order_by("sort_order", "id").first()
        media_url = request.build_absolute_uri(media.media_file.url) if media and media.media_file else ""
        items.append(
            {
                "id": str(item.id),
                "title": item.title,
                "status": item.status,
                "mediaType": media.media_type if media else "image",
                "mediaUrl": media_url,
                "location": item.location_text,
                "submittedBy": item.reporter.full_name,
                "submittedAt": item.created_at,
                "description": item.description,
                "authenticityDetail": item.authenticity_detail,
                "category": item.category,
                "isUrgent": item.verification_status == "under-review",
                "verificationStatus": item.verification_status,
                "approvedAt": None,
                "rejectionReason": None,
            }
        )
    return Response({"success": True, "items": items})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminRole])
def approve_item(request, item_id: int):
    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return Response({"success": False, "message": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    item.verification_status = "verified"
    item.save(update_fields=["verification_status", "updated_at"])
    run_auto_match_for_item(item)

    return Response({"success": True, "message": "Item approved successfully.", "itemId": item.id})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminRole])
def reject_item(request, item_id: int):
    reason = str(request.data.get("reason", "")).strip()
    if not reason:
        return Response({"success": False, "message": "Rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return Response({"success": False, "message": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    item.verification_status = "rejected"
    item.save(update_fields=["verification_status", "updated_at"])

    return Response({"success": True, "message": "Item rejected successfully.", "itemId": item.id})
