from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    ordering = ("username",)
    fieldsets = UserAdmin.fieldsets + (
        ("Restaurant", {"fields": ("role", "phone", "created_at")}),
    )
    readonly_fields = ("created_at",)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Restaurant", {"fields": ("email", "first_name", "last_name", "role", "phone")}),
    )
