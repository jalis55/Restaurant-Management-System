from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole

MENU_READ_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN,
}

TABLE_READ_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
}

ORDER_CREATE_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
}

ORDER_VIEW_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN,
    UserRole.CASHIER,
}

RESERVATION_MANAGE_ROLES = {
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
}


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


class CanReadMenu(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in MENU_READ_ROLES)


class CanReadTables(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in TABLE_READ_ROLES)


class CanCreateOrder(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ORDER_CREATE_ROLES)


class CanViewOrders(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ORDER_VIEW_ROLES)


class CanUpdateOrderStatus(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ORDER_VIEW_ROLES)


class CanDeleteOrder(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {UserRole.ADMIN, UserRole.MANAGER}
        )


class CanManageReservations(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in RESERVATION_MANAGE_ROLES)


class CanDeleteReservation(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {UserRole.ADMIN, UserRole.MANAGER}
        )
