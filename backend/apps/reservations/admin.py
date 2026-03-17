from django.contrib import admin

from apps.reservations.models import Reservation, Table


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ("number", "capacity", "location", "is_active")
    list_filter = ("is_active", "location")
    search_fields = ("number", "location")
    ordering = ("number",)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "table", "party_size", "reserved_at", "reserved_until", "status", "created_by")
    list_filter = ("status", "reserved_at", "table")
    search_fields = ("guest_name", "guest_phone", "guest_email")
    ordering = ("reserved_at",)
