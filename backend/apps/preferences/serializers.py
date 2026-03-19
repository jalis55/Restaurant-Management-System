from rest_framework import serializers

from apps.preferences.models import BillingSettings


class BillingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingSettings
        fields = ["tax_percentage", "service_charge_percentage", "updated_at"]
        read_only_fields = ["updated_at"]
