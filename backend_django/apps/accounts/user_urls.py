from django.urls import path
from .views import (
    get_user_profile,
    login_user,
    setup_two_fa,
    signup_user,
    verify_login_2fa,
    verify_two_fa_setup,
)

urlpatterns = [
    path("signup", signup_user),
    path("login", login_user),
    path("login/verify-2fa", verify_login_2fa),
    path("profile", get_user_profile),
    path("2fa/setup", setup_two_fa),
    path("2fa/verify", verify_two_fa_setup),
]
