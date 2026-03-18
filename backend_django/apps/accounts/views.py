import base64
from io import BytesIO
import pyotp
import qrcode
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdminRole
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserSignupSerializer,
)
from apps.items.models import Item
from apps.notifications.models import Notification

User = get_user_model()


def _token_pair_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return str(refresh.access_token), str(refresh)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_user(request):
    serializer = UserSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({"success": True, "message": "User registered successfully.", "userId": user.id}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if user.role != "user" or not user.is_active:
        return Response({"success": False, "message": "Invalid user credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    if user.two_fa_enabled:
        return Response({"success": True, "requires2FA": True, "userId": user.id, "message": "2FA verification required."})

    token, _refresh = _token_pair_for_user(user)
    return Response(
        {
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user.id,
                "fullName": user.full_name,
                "email": user.email,
                "role": user.role,
                "trustLevel": user.trust_level,
            },
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_login_2fa(request):
    user_id = request.data.get("userId")
    otp_code = str(request.data.get("code", "")).strip()

    if not user_id or not otp_code:
        return Response({"success": False, "message": "userId and code are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id, role="user", is_active=True)
    except User.DoesNotExist:
        return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    if not user.two_fa_enabled or not user.two_fa_secret:
        return Response({"success": False, "message": "2FA is not enabled for this user."}, status=status.HTTP_400_BAD_REQUEST)

    if not pyotp.TOTP(user.two_fa_secret).verify(otp_code):
        return Response({"success": False, "message": "Invalid verification code."}, status=status.HTTP_401_UNAUTHORIZED)

    token, _refresh = _token_pair_for_user(user)
    return Response(
        {
            "success": True,
            "message": "2FA login successful.",
            "token": token,
            "user": {
                "id": user.id,
                "fullName": user.full_name,
                "email": user.email,
                "role": user.role,
                "trustLevel": user.trust_level,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
    return Response({"success": True, "user": UserProfileSerializer(request.user).data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    full_name = serializer.validated_data["fullName"]
    request.user.first_name = full_name
    request.user.last_name = ""
    request.user.save(update_fields=["first_name", "last_name"])

    return Response(
        {
            "success": True,
            "message": "Profile updated successfully.",
            "user": UserProfileSerializer(request.user).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_user_password(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    current_password = serializer.validated_data["currentPassword"]
    new_password = serializer.validated_data["newPassword"]

    if not request.user.check_password(current_password):
        return Response({"success": False, "message": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new_password)
    request.user.save(update_fields=["password"])

    return Response({"success": True, "message": "Password changed successfully. Please log in again."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_two_fa(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    secret = pyotp.random_base32()
    request.user.two_fa_secret = secret
    request.user.save(update_fields=["two_fa_secret"])

    issuer = "KhojTalas"
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=request.user.email, issuer_name=issuer)
    qr = qrcode.make(totp_uri)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return Response({"success": True, "secret": secret, "otpAuthUrl": totp_uri, "qrCodeBase64": qr_base64})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_two_fa_setup(request):
    if request.user.role != "user":
        return Response({"success": False, "message": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    code = str(request.data.get("code", "")).strip()
    if not request.user.two_fa_secret:
        return Response({"success": False, "message": "2FA setup not initialized."}, status=status.HTTP_400_BAD_REQUEST)

    if not pyotp.TOTP(request.user.two_fa_secret).verify(code):
        return Response({"success": False, "message": "Invalid verification code."}, status=status.HTTP_401_UNAUTHORIZED)

    request.user.two_fa_enabled = True
    request.user.save(update_fields=["two_fa_enabled"])
    return Response({"success": True, "message": "2FA enabled successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_admin(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if user.role != "admin" or not user.is_active:
        return Response({"success": False, "message": "Invalid admin credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    token, _refresh = _token_pair_for_user(user)
    return Response(
        {
            "success": True,
            "message": "Admin login successful.",
            "token": token,
            "adminName": user.full_name,
            "admin": {"id": user.id, "fullName": user.full_name, "email": user.email, "role": user.role},
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_admin_dashboard(request):
    total_reports = Item.objects.count()
    pending_approvals = Item.objects.filter(verification_status="under-review").count()
    verified_items = Item.objects.filter(verification_status="verified").count()
    total_users = User.objects.filter(role="user").count()
    urgent_cases = Item.objects.filter(verification_status="under-review").count()
    total_lost_items = Item.objects.filter(status="LOST").count()
    total_found_items = Item.objects.filter(status="FOUND").count()

    return Response(
        {
            "success": True,
            "stats": {
                "totalReports": total_reports,
                "pendingApprovals": pending_approvals,
                "verifiedItems": verified_items,
                "totalUsers": total_users,
                "urgentCases": urgent_cases,
                "totalLostItems": total_lost_items,
                "totalFoundItems": total_found_items,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_admin_users(request):
    users = (
        User.objects.filter(role="user")
        .annotate(items_reported=Count("items"))
        .order_by("-date_joined")
    )

    payload = [
        {
            "id": str(user.id),
            "name": user.full_name,
            "email": user.email,
            "trustLevel": user.trust_level,
            "itemsReported": user.items_reported,
            "isSuspended": not user.is_active,
            "joinedAt": user.date_joined,
        }
        for user in users
    ]
    return Response({"success": True, "users": payload})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def get_admin_reports(request):
    reports = (
        Notification.objects.filter(Q(type="system_update") | Q(type="nearby_item") | Q(type="ai_match_detected"))
        .select_related("user")
        .order_by("-created_at")[:100]
    )

    payload = [
        {
            "id": str(report.id),
            "reportType": report.type,
            "reportedAt": report.created_at,
            "notes": report.body,
            "reportedBy": report.user.full_name,
            "status": "open" if not report.is_read else "reviewed",
            "targetItemId": report.payload.get("foundItemId") or report.payload.get("lostItemId"),
        }
        for report in reports
    ]
    return Response({"success": True, "reports": payload})
