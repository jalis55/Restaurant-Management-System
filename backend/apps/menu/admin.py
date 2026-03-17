from django.contrib import admin

from apps.menu.models import Category, MenuItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "display_order", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    ordering = ("display_order", "name")


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_available", "is_featured", "display_order")
    list_filter = ("category", "is_available", "is_featured")
    search_fields = ("name", "description", "category__name")
    ordering = ("category", "display_order", "name")
