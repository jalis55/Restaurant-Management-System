from rest_framework import serializers

from apps.menu.models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "price",
            "image",
            "service_station",
            "offer_percentage",
            "is_available",
            "is_featured",
            "preparation_time",
            "calories",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "category_name"]


class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "display_order",
            "is_active",
            "created_at",
            "items_count",
        ]
        read_only_fields = ["id", "created_at", "items_count"]


class CategoryDetailSerializer(CategorySerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ["items"]
