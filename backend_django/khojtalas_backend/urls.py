from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"success": True, "message": "KhojTalas Django backend is running."})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/user/", include("apps.accounts.user_urls")),
    path("api/admin/", include("apps.accounts.admin_urls")),
    path("api/user/", include("apps.items.user_urls")),
    path("api/admin/", include("apps.items.admin_urls")),
    path("api/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
