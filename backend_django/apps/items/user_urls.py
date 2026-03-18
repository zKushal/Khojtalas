from django.urls import path
from .views import get_ai_matches, get_my_items, items_endpoint, mark_match_incorrect, mark_match_recovered

urlpatterns = [
    path("items", items_endpoint),
    path("my-items", get_my_items),
    path("matches", get_ai_matches),
    path("matches/<int:match_id>/recover", mark_match_recovered),
    path("matches/<int:match_id>/incorrect", mark_match_incorrect),
]
