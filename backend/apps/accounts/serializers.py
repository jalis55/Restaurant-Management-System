from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User, UserRole

MANAGER_ASSIGNABLE_ROLES = {UserRole.WAITER, UserRole.KITCHEN}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "password",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_role(self, value):
        request = self.context.get("request")
        if getattr(request.user, "role", None) == UserRole.MANAGER and value not in MANAGER_ASSIGNABLE_ROLES:
            raise serializers.ValidationError("Managers can only assign waiter or kitchen roles.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(UserSerializer):
    def validate_role(self, value):
        request = self.context.get("request")
        actor_role = getattr(request.user, "role", None)
        instance = getattr(self, "instance", None)

        if actor_role != UserRole.MANAGER:
            return value

        if instance == request.user:
            if value != UserRole.MANAGER:
                raise serializers.ValidationError("Managers cannot change their own role.")
            return value

        if value not in MANAGER_ASSIGNABLE_ROLES:
            raise serializers.ValidationError("Managers can only assign waiter or kitchen roles.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value
