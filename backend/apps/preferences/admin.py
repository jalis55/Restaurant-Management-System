from django.contrib import admin

from apps.preferences.models import BillingSettings


@admin.register(BillingSettings)
class BillingSettingsAdmin(admin.ModelAdmin):
    list_display = ("tax_percentage", "service_charge_percentage", "updated_at")
