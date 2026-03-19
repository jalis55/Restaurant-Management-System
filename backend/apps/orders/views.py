from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanCreateOrder, CanDeleteOrder, CanUpdateOrderStatus, CanViewOrders, IsAdminOrManager
from apps.menu.models import MenuServiceStation
from apps.orders.models import Order, OrderStatus
from apps.orders.serializers import CounterItemServeSerializer, OrderBillingSerializer, OrderSerializer, OrderStatusUpdateSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("created_by").prefetch_related("items__menu_item").all()
    serializer_class = OrderSerializer
    search_fields = ["order_number", "notes", "created_by__username"]
    ordering_fields = ["created_at", "updated_at", "total_amount", "status"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "active", "kitchen"}:
            permission_classes = [IsAuthenticated, CanViewOrders]
        elif self.action == "create":
            permission_classes = [IsAuthenticated, CanCreateOrder]
        elif self.action in {"update_status", "serve_counter_items"}:
            permission_classes = [IsAuthenticated, CanUpdateOrderStatus]
        elif self.action == "bill":
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated, CanDeleteOrder]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        if getattr(self.request.user, "role", None) == UserRole.KITCHEN:
            return queryset.exclude(status__in=[OrderStatus.SERVED, OrderStatus.CANCELLED]).filter(items__service_station=MenuServiceStation.KITCHEN).distinct()
        return queryset

    @action(detail=False, methods=["get"])
    def active(self, request):
        queryset = self.get_queryset().exclude(status__in=[OrderStatus.SERVED, OrderStatus.CANCELLED])
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def kitchen(self, request):
        queryset = self.get_queryset().filter(status__in=[OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY], items__service_station=MenuServiceStation.KITCHEN).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data, context={"order": order, "request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def serve_counter_items(self, request, pk=None):
        order = self.get_object()
        serializer = CounterItemServeSerializer(data=request.data, context={"order": order, "request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def bill(self, request, pk=None):
        order = self.get_object()
        serializer = OrderBillingSerializer(data=request.data, context={"order": order, "request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)
