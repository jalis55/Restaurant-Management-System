from django.contrib import admin

from apps.orders.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "order_type", "status", "table_number", "created_by", "total_amount", "final_amount", "billed_at", "created_at")
    list_filter = ("order_type", "status", "discount_type", "created_at", "billed_at")
    search_fields = ("order_number", "created_by__username", "notes")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "menu_item", "quantity", "unit_price")
    list_filter = ("menu_item__category",)
    search_fields = ("order__order_number", "menu_item__name")
