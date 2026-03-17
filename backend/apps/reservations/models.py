from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class ReservationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    SEATED = "seated", "Seated"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    NO_SHOW = "no_show", "No Show"


class Table(models.Model):
    number = models.PositiveIntegerField(unique=True)
    capacity = models.PositiveIntegerField()
    location = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["number"]

    def __str__(self) -> str:
        return f"Table {self.number}"


class Reservation(models.Model):
    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name="reservations")
    guest_name = models.CharField(max_length=160)
    guest_phone = models.CharField(max_length=32)
    guest_email = models.EmailField(blank=True)
    party_size = models.PositiveIntegerField()
    reserved_at = models.DateTimeField()
    reserved_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=ReservationStatus.choices, default=ReservationStatus.PENDING)
    special_requests = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reservations")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["reserved_at"]

    def __str__(self) -> str:
        return f"{self.guest_name} - {self.table}"

    def clean(self):
        if self.reserved_until <= self.reserved_at:
            raise ValidationError({"reserved_until": "Reservation end time must be after start time."})
        if self.party_size > self.table.capacity:
            raise ValidationError({"party_size": "Party size cannot exceed the selected table capacity."})
