from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {UserRole.ADMIN, UserRole.MANAGER}
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsStaffRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                UserRole.ADMIN,
                UserRole.MANAGER,
                UserRole.WAITER,
                UserRole.KITCHEN,
                UserRole.CASHIER,
            }
        )
