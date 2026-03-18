from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification


@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{instance.user_id}",
        {
            "type": "notify",
            "data": {
                "id": instance.id,
                "type": instance.type,
                "title": instance.title,
                "body": instance.body,
                "payload": instance.payload,
                "isRead": instance.is_read,
                "createdAt": instance.created_at.isoformat(),
            },
        },
    )
