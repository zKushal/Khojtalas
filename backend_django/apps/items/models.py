from django.conf import settings
from django.db import models


class Item(models.Model):
    STATUS_CHOICES = (("LOST", "LOST"), ("FOUND", "FOUND"))
    VERIFY_CHOICES = (("under-review", "under-review"), ("verified", "verified"), ("rejected", "rejected"))

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="items")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    category = models.CharField(max_length=64)
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    location_from = models.CharField(max_length=240, blank=True)
    location_to = models.CharField(max_length=240, blank=True)
    location_text = models.CharField(max_length=240)
    incident_from = models.DateTimeField(null=True, blank=True)
    incident_to = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    incident_at = models.DateTimeField()
    visibility_scope = models.CharField(max_length=32, default="nearby")
    verification_status = models.CharField(max_length=32, choices=VERIFY_CHOICES, default="under-review")
    authenticity_detail = models.TextField()
    feature_data = models.JSONField(default=dict, blank=True)
    ai_suggested_category = models.CharField(max_length=64, blank=True)
    helpful_count = models.PositiveIntegerField(default=0)
    details_count = models.PositiveIntegerField(default=0)
    share_count = models.PositiveIntegerField(default=0)
    current_state = models.CharField(max_length=32, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ItemMedia(models.Model):
    MEDIA_CHOICES = (("image", "image"), ("video", "video"))

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="media")
    media_type = models.CharField(max_length=10, choices=MEDIA_CHOICES)
    media_file = models.FileField(upload_to="items/")
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=1)


class ItemTag(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="tags")
    tag = models.CharField(max_length=50)


class MatchResult(models.Model):
    FEEDBACK_CHOICES = (("pending", "pending"), ("recovered", "recovered"), ("incorrect", "incorrect"))

    lost_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="lost_matches")
    found_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="found_matches")
    similarity_score = models.DecimalField(max_digits=5, decimal_places=2)
    is_auto_notified = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    feedback_status = models.CharField(max_length=16, choices=FEEDBACK_CHOICES, default="pending")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("lost_item", "found_item")
