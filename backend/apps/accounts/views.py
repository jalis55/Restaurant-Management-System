from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsAdminOrManager, IsStaffRole
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
)


class UserViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in {"me", "change_password"}:
            permission_classes = [IsAuthenticated, IsStaffRole]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated, IsAdmin]
        elif self.action in {"retrieve", "update", "partial_update"}:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="change_password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
