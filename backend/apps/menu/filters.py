import django_filters

from apps.menu.models import MenuItem


class MenuItemFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = MenuItem
        fields = ["category", "is_available", "is_featured", "min_price", "max_price"]
