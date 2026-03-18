from django.urls import path
from .views import approve_item, get_admin_items, reject_item

urlpatterns = [
    path("items", get_admin_items),
    path("items/<int:item_id>/approve", approve_item),
    path("items/<int:item_id>/reject", reject_item),
]
