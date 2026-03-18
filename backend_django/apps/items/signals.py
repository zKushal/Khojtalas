from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Item
from apps.matching.services import suggest_category_from_description


@receiver(post_save, sender=Item)
def assign_ai_category(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.ai_suggested_category:
        return
    if not instance.description:
        return

    instance.ai_suggested_category = suggest_category_from_description(instance.description)
    instance.save(update_fields=["ai_suggested_category"])
