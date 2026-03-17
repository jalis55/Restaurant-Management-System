from rest_framework import serializers


class DashboardReportSerializer(serializers.Serializer):
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    reservations_today = serializers.IntegerField()


class RevenueEntrySerializer(serializers.Serializer):
    day = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders = serializers.IntegerField()


class TopItemEntrySerializer(serializers.Serializer):
    menu_item__id = serializers.IntegerField()
    menu_item__name = serializers.CharField()
    quantity_sold = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class StatusCountSerializer(serializers.Serializer):
    status = serializers.CharField()
    count = serializers.IntegerField()


class DayCountSerializer(serializers.Serializer):
    day = serializers.DateField()
    count = serializers.IntegerField()


class OrdersReportSerializer(serializers.Serializer):
    by_status = StatusCountSerializer(many=True)
    by_day = DayCountSerializer(many=True)


class ReservationsReportSerializer(serializers.Serializer):
    by_status = StatusCountSerializer(many=True)
    by_day = DayCountSerializer(many=True)
    no_shows = serializers.IntegerField()


class StaffReportEntrySerializer(serializers.Serializer):
    created_by__id = serializers.IntegerField()
    created_by__username = serializers.CharField()
    created_by__first_name = serializers.CharField(allow_blank=True)
    created_by__last_name = serializers.CharField(allow_blank=True)
    order_count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    reservation_count = serializers.IntegerField()
