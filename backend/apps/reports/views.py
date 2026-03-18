from io import BytesIO

from datetime import timedelta

from django.http import HttpResponse
from django.db.models import Count, Sum
from django.db.models import DecimalField, F
from django.db.models.functions import TruncDate
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrManager
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reports.serializers import (
    BillReportEntrySerializer,
    DashboardReportSerializer,
    OrdersReportSerializer,
    ReservationsReportSerializer,
    RevenueEntrySerializer,
    StaffReportEntrySerializer,
    TopItemEntrySerializer,
)
from apps.reservations.models import Reservation, ReservationStatus
from .bill_pdf_builder import build_bill_pdf


class ReportsBaseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get_days(self):
        try:
            return max(1, int(self.request.query_params.get("days", 30)))
        except (TypeError, ValueError):
            return 30

    def get_start_date(self):
        return timezone.now() - timedelta(days=self.get_days())

    def get_billed_orders(self):
        return (
            Order.objects.filter(status=OrderStatus.SERVED, billed_at__isnull=False)
            .select_related("created_by", "billed_by")
            .prefetch_related("items__menu_item")
            .order_by("-billed_at", "-created_at")
        )


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


class BillsReportView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses=BillReportEntrySerializer(many=True))
    def get(self, request):
        start_date = self.get_start_date()
        orders = self.get_billed_orders().filter(billed_at__gte=start_date)

        data = [
            {
                "id": order.id,
                "order_number": order.order_number,
                "table_number": order.table_number,
                "order_type": order.order_type,
                "status": order.status,
                "created_by_name": order.created_by.get_full_name() or order.created_by.username,
                "billed_by_name": (order.billed_by.get_full_name() or order.billed_by.username) if order.billed_by else "",
                "billed_at": order.billed_at,
                "total_amount": order.total_amount,
                "discount_type": order.discount_type,
                "discount_value": order.discount_value,
                "discount_amount": order.discount_amount,
                "final_amount": order.final_amount,
                "item_count": sum(item.quantity for item in order.items.all()),
            }
            for order in orders
        ]
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


# ================== pdf bill download view ==================
class BillPdfDownloadView(ReportsBaseView):
    @extend_schema(tags=["reports"], responses={200: {"type": "string", "format": "binary"}})
    def get(self, request, order_id):
        order = self.get_billed_orders().filter(pk=order_id).first()
        if not order:
            return Response({"detail": "Billed order not found."}, status=404)
 
        buffer = build_bill_pdf(order)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="bill-{order.order_number}.pdf"'
        return response
 