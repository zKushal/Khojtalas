from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class UserSignupSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User already exists with this email.")
        return value.lower().strip()

    def create(self, validated_data):
        full_name = validated_data["fullName"].strip()
        user = User.objects.create_user(
            username=validated_data["email"].lower().strip(),
            email=validated_data["email"].lower().strip(),
            password=validated_data["password"],
            first_name=full_name,
            role="user",
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        user = authenticate(username=email, password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.SerializerMethodField()
    trustLevel = serializers.CharField(source="trust_level")
    isActive = serializers.BooleanField(source="is_active")
    createdAt = serializers.DateTimeField(source="date_joined")

    class Meta:
        model = User
        fields = ["id", "fullName", "email", "trustLevel", "role", "isActive", "createdAt"]

    def get_fullName(self, obj):
        return obj.full_name


class UserProfileUpdateSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=160)

    def validate_fullName(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return name


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField()
    newPassword = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs["currentPassword"] == attrs["newPassword"]:
            raise serializers.ValidationError("New password must be different from current password.")
        return attrs
