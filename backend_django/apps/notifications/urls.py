from django.urls import path
from .views import list_notifications, mark_notification_read

urlpatterns = [
    path("notifications", list_notifications),
    path("notifications/<int:notification_id>/read", mark_notification_read),
]
