from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models import DecimalField, F
from django.db.models.functions import TruncDate
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrManager
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reports.serializers import (
    DashboardReportSerializer,
    OrdersReportSerializer,
    ReservationsReportSerializer,
    RevenueEntrySerializer,
    StaffReportEntrySerializer,
    TopItemEntrySerializer,
)
from apps.reservations.models import Reservation, ReservationStatus


class ReportsBaseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get_days(self):
        try:
            return max(1, int(self.request.query_params.get("days", 30)))
        except (TypeError, ValueError):
            return 30

    def get_start_date(self):
        return timezone.now() - timedelta(days=self.get_days())


class DashboardReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=DashboardReportSerializer)
    def get(self, request):
        start_date = self.get_start_date()
        data = {
            "revenue": Order.objects.filter(created_at__gte=start_date, status=OrderStatus.SERVED).aggregate(total=Sum("final_amount"))["total"] or 0,
            "orders": Order.objects.filter(created_at__gte=start_date).count(),
            "active_orders": Order.objects.exclude(status__in=[OrderStatus.SERVED, OrderStatus.CANCELLED]).count(),
            "reservations_today": Reservation.objects.filter(reserved_at__date=timezone.localdate()).count(),
        }
        return Response(data)


class RevenueReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=RevenueEntrySerializer(many=True))
    def get(self, request):
        start_date = self.get_start_date()
        data = list(
            Order.objects.filter(created_at__gte=start_date, status=OrderStatus.SERVED)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("final_amount"), orders=Count("id"))
            .order_by("day")
        )
        return Response(data)


class TopItemsReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=TopItemEntrySerializer(many=True))
    def get(self, request):
        start_date = self.get_start_date()
        try:
            limit = max(1, int(request.query_params.get("limit", 10)))
        except (TypeError, ValueError):
            limit = 10
        data = list(
            OrderItem.objects.filter(order__created_at__gte=start_date, order__status=OrderStatus.SERVED)
            .values("menu_item__id", "menu_item__name")
            .annotate(
                quantity_sold=Sum("quantity"),
                revenue=Sum(F("quantity") * F("unit_price"), output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
            .order_by("-quantity_sold", "-revenue")[:limit]
        )
        return Response(data)


class OrdersReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=OrdersReportSerializer)
    def get(self, request):
        start_date = self.get_start_date()
        by_status = list(
            Order.objects.filter(created_at__gte=start_date).values("status").annotate(count=Count("id")).order_by("status")
        )
        by_day = list(
            Order.objects.filter(created_at__gte=start_date)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        return Response({"by_status": by_status, "by_day": by_day})


class ReservationsReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=ReservationsReportSerializer)
    def get(self, request):
        start_date = self.get_start_date()
        by_status = list(
            Reservation.objects.filter(created_at__gte=start_date).values("status").annotate(count=Count("id")).order_by("status")
        )
        by_day = list(
            Reservation.objects.filter(created_at__gte=start_date)
            .annotate(day=TruncDate("reserved_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        no_shows = Reservation.objects.filter(created_at__gte=start_date, status=ReservationStatus.NO_SHOW).count()
        return Response({"by_status": by_status, "by_day": by_day, "no_shows": no_shows})


class StaffReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=StaffReportEntrySerializer(many=True))
    def get(self, request):
        start_date = self.get_start_date()
        order_stats = list(
            Order.objects.filter(created_at__gte=start_date)
            .values("created_by__id", "created_by__username", "created_by__first_name", "created_by__last_name")
            .annotate(order_count=Count("id"), revenue=Sum("final_amount"))
            .order_by("-order_count", "-revenue")
        )
        reservation_stats = list(
            Reservation.objects.filter(created_at__gte=start_date)
            .values("created_by__id")
            .annotate(reservation_count=Count("id"))
        )
        reservation_map = {row["created_by__id"]: row["reservation_count"] for row in reservation_stats}
        for row in order_stats:
            row["reservation_count"] = reservation_map.get(row["created_by__id"], 0)
        return Response(order_stats)
