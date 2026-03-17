from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone

from apps.menu.models import MenuItem


class OrderType(models.TextChoices):
    DINE_IN = "dine_in", "Dine In"
    TAKEAWAY = "takeaway", "Takeaway"
    DELIVERY = "delivery", "Delivery"


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    PREPARING = "preparing", "Preparing"
    READY = "ready", "Ready"
    SERVED = "served", "Served"
    CANCELLED = "cancelled", "Cancelled"

    @classmethod
    def allowed_transitions(cls):
        return {
            cls.PENDING: {cls.CONFIRMED, cls.CANCELLED},
            cls.CONFIRMED: {cls.PREPARING, cls.CANCELLED},
            cls.PREPARING: {cls.READY, cls.CANCELLED},
            cls.READY: {cls.SERVED, cls.CANCELLED},
            cls.SERVED: set(),
            cls.CANCELLED: set(),
        }


class Order(models.Model):
    order_number = models.CharField(max_length=32, unique=True, blank=True)
    table_number = models.PositiveIntegerField(null=True, blank=True)
    order_type = models.CharField(max_length=20, choices=OrderType.choices, default=OrderType.DINE_IN)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.order_number

    def clean(self):
        if self.order_type == OrderType.DINE_IN and not self.table_number:
            raise ValidationError({"table_number": "Table number is required for dine-in orders."})

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        self.full_clean()
        super().save(*args, **kwargs)

    def generate_order_number(self) -> str:
        stamp = timezone.localtime().strftime("%Y%m%d%H%M%S")
        return f"ORD-{stamp}-{uuid4().hex[:6].upper()}"

    def recalculate_total(self):
        total = self.items.aggregate(
            total=Sum(models.F("quantity") * models.F("unit_price"), output_field=models.DecimalField(max_digits=14, decimal_places=2))
        )["total"] or Decimal("0.00")
        self.total_amount = total.quantize(Decimal("0.01"))
        self.save(update_fields=["total_amount", "updated_at"])

    def update_status(self, new_status: str):
        allowed = OrderStatus.allowed_transitions()[self.status]
        if new_status not in allowed:
            raise ValidationError(f"Cannot change status from {self.status} to {new_status}.")
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.menu_item.name} x {self.quantity}"
