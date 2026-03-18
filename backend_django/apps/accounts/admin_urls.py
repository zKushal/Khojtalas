from django.urls import path
from .views import get_admin_dashboard, get_admin_reports, get_admin_users, login_admin

urlpatterns = [
    path("login", login_admin),
    path("dashboard", get_admin_dashboard),
    path("users", get_admin_users),
    path("reports", get_admin_reports),
]
