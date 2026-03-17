from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.menu.models import MenuItem
from apps.orders.events import broadcast_order_event
from apps.orders.models import Order, OrderItem, OrderStatus, OrderType


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "menu_item_name", "quantity", "unit_price", "notes"]
        read_only_fields = ["id", "menu_item_name", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

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
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "order_number", "status", "created_by", "total_amount", "created_at", "updated_at"]

    def validate(self, attrs):
        order_type = attrs.get("order_type", getattr(self.instance, "order_type", None))
        table_number = attrs.get("table_number", getattr(self.instance, "table_number", None))
        if order_type == OrderType.DINE_IN and not table_number:
            raise serializers.ValidationError({"table_number": "Table number is required for dine-in orders."})
        return attrs

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
