from django.urls import path

from apps.reports.views import (
    BillPdfDownloadView,
    BillsReportView,
    DashboardReportView,
    OrdersReportView,
    ReservationsReportView,
    RevenueReportView,
    StaffReportView,
    TopItemsReportView,
)

urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="reports-dashboard"),
    path("bills/", BillsReportView.as_view(), name="reports-bills"),
    path("bills/<int:order_id>/pdf/", BillPdfDownloadView.as_view(), name="reports-bill-pdf"),
    path("revenue/", RevenueReportView.as_view(), name="reports-revenue"),
    path("top-items/", TopItemsReportView.as_view(), name="reports-top-items"),
    path("orders/", OrdersReportView.as_view(), name="reports-orders"),
    path("reservations/", ReservationsReportView.as_view(), name="reports-reservations"),
    path("staff/", StaffReportView.as_view(), name="reports-staff"),
]
