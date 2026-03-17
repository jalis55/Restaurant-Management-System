from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from apps.reservations.models import Reservation, ReservationStatus, Table


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ["id", "number", "capacity", "location", "is_active"]
        read_only_fields = ["id"]


class ReservationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    table_number = serializers.IntegerField(source="table.number", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "table",
            "table_number",
            "guest_name",
            "guest_phone",
            "guest_email",
            "party_size",
            "reserved_at",
            "reserved_until",
            "status",
            "special_requests",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_by_name", "created_at", "table_number"]

    def validate(self, attrs):
        table = attrs.get("table", getattr(self.instance, "table", None))
        reserved_at = attrs.get("reserved_at", getattr(self.instance, "reserved_at", None))
        reserved_until = attrs.get("reserved_until", getattr(self.instance, "reserved_until", None))
        party_size = attrs.get("party_size", getattr(self.instance, "party_size", None))
        if reserved_until <= reserved_at:
            raise serializers.ValidationError({"reserved_until": "Reservation end time must be after start time."})
        if party_size > table.capacity:
            raise serializers.ValidationError({"party_size": "Party size cannot exceed the selected table capacity."})
        overlapping = Reservation.objects.filter(
            table=table,
            status__in=[
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.SEATED,
            ],
        ).filter(Q(reserved_at__lt=reserved_until) & Q(reserved_until__gt=reserved_at))
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)
        if overlapping.exists():
            raise serializers.ValidationError({"table": "This table is already booked for the selected time range."})
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ReservationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ReservationStatus.choices)


class TableAvailabilitySerializer(serializers.Serializer):
    reserved_at = serializers.DateTimeField()
    reserved_until = serializers.DateTimeField()
    party_size = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        if attrs["reserved_until"] <= attrs["reserved_at"]:
            raise serializers.ValidationError({"reserved_until": "End time must be after start time."})
        if attrs["reserved_until"] < timezone.now():
            raise serializers.ValidationError({"reserved_until": "Availability must be checked for a future time."})
        return attrs
