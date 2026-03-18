from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.menu.models import MenuItem
from apps.orders.events import broadcast_order_event
from apps.orders.models import BillingDiscountType, Order, OrderItem, OrderStatus, OrderType


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "menu_item_name", "quantity", "unit_price", "notes"]
        read_only_fields = ["id", "menu_item_name", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    billed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "table_number",
            "order_type",
            "status",
            "created_by",
            "created_by_name",
            "notes",
            "total_amount",
            "discount_type",
            "discount_value",
            "discount_amount",
            "final_amount",
            "billed_at",
            "billed_by",
            "billed_by_name",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "status",
            "created_by",
            "total_amount",
            "discount_type",
            "discount_value",
            "discount_amount",
            "final_amount",
            "billed_at",
            "billed_by",
            "billed_by_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        order_type = attrs.get("order_type", getattr(self.instance, "order_type", None))
        table_number = attrs.get("table_number", getattr(self.instance, "table_number", None))
        if order_type == OrderType.DINE_IN and not table_number:
            raise serializers.ValidationError({"table_number": "Table number is required for dine-in orders."})
        return attrs

    def get_billed_by_name(self, obj):
        if not obj.billed_by:
            return ""
        return obj.billed_by.get_full_name()

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        validated_data["created_by"] = self.context["request"].user
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            menu_item = item_data["menu_item"]
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item_data["quantity"],
                unit_price=menu_item.price,
                notes=item_data.get("notes", ""),
            )
        order.recalculate_total()
        broadcast_order_event("order.created", OrderSerializer(order, context=self.context).data)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                menu_item = item_data["menu_item"]
                OrderItem.objects.create(
                    order=instance,
                    menu_item=menu_item,
                    quantity=item_data["quantity"],
                    unit_price=menu_item.price,
                    notes=item_data.get("notes", ""),
                )
            instance.recalculate_total()
        return instance


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)

    def validate_status(self, value):
        order = self.context["order"]
        request = self.context.get("request")
        user_role = getattr(request.user, "role", None)

        if user_role == UserRole.WAITER and value == OrderStatus.CONFIRMED:
            raise serializers.ValidationError("Waiters cannot confirm orders.")

        if user_role == UserRole.KITCHEN and order.status == OrderStatus.READY:
            raise serializers.ValidationError("Kitchen cannot serve or cancel an order after it is ready.")

        return value

    def save(self, **kwargs):
        order = self.context["order"]
        try:
            order.update_status(self.validated_data["status"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message)
        broadcast_order_event("order.status_updated", OrderSerializer(order, context=self.context).data)
        return order


class OrderBillingSerializer(serializers.Serializer):
    discount_type = serializers.ChoiceField(choices=BillingDiscountType.choices, default=BillingDiscountType.NONE)
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)

    def validate(self, attrs):
        order = self.context["order"]
        request = self.context["request"]
        discount_type = attrs.get("discount_type", BillingDiscountType.NONE)
        discount_value = attrs.get("discount_value", 0)

        if getattr(request.user, "role", None) not in {UserRole.ADMIN, UserRole.MANAGER}:
            raise serializers.ValidationError({"detail": "Only managers can complete billing."})

        if order.status != OrderStatus.SERVED:
            raise serializers.ValidationError({"detail": "Only served orders can be billed."})

        if discount_value < 0:
            raise serializers.ValidationError({"discount_value": "Discount value cannot be negative."})

        if discount_type == BillingDiscountType.NONE and discount_value != 0:
            raise serializers.ValidationError({"discount_value": "Discount value must be 0 when no discount is selected."})

        if discount_type == BillingDiscountType.AMOUNT and discount_value > order.total_amount:
            raise serializers.ValidationError({"discount_value": "Discount amount cannot exceed the order total."})

        if discount_type == BillingDiscountType.PERCENTAGE and discount_value > 100:
            raise serializers.ValidationError({"discount_value": "Percentage discount cannot exceed 100%."})

        if discount_type in {BillingDiscountType.AMOUNT, BillingDiscountType.PERCENTAGE} and discount_value == 0:
            raise serializers.ValidationError({"discount_value": "Enter a discount value greater than 0."})

        attrs["discount_value"] = discount_value
        return attrs

    def save(self, **kwargs):
        order = self.context["order"]
        request = self.context["request"]

        try:
            order.apply_billing(
                discount_type=self.validated_data["discount_type"],
                discount_value=self.validated_data["discount_value"],
                billed_by=request.user,
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"detail": exc.message})

        broadcast_order_event("order.billed", OrderSerializer(order, context=self.context).data)
        return order
