from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import CanDeleteReservation, CanManageReservations, CanReadTables, IsAdminOrManager
from apps.reservations.models import Reservation, ReservationStatus, Table
from apps.reservations.serializers import (
    ReservationSerializer,
    ReservationStatusUpdateSerializer,
    TableAvailabilitySerializer,
    TableSerializer,
)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related("table", "created_by").all()
    serializer_class = ReservationSerializer
    search_fields = ["guest_name", "guest_phone", "guest_email"]
    ordering_fields = ["reserved_at", "reserved_until", "created_at", "status"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "today", "create", "update", "partial_update", "update_status"}:
            permission_classes = [IsAuthenticated, CanManageReservations]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated, CanDeleteReservation]
        else:
            permission_classes = [IsAuthenticated, CanManageReservations]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get"])
    def today(self, request):
        today = timezone.localdate()
        queryset = self.get_queryset().filter(reserved_at__date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        reservation = self.get_object()
        serializer = ReservationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation.status = serializer.validated_data["status"]
        reservation.save(update_fields=["status"])
        return Response(self.get_serializer(reservation).data, status=status.HTTP_200_OK)


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    search_fields = ["location"]
    ordering_fields = ["number", "capacity"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "availability"}:
            permission_classes = [IsAuthenticated, CanReadTables]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["post"])
    def availability(self, request):
        serializer = TableAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reserved_at = serializer.validated_data["reserved_at"]
        reserved_until = serializer.validated_data["reserved_until"]
        party_size = serializer.validated_data["party_size"]

        unavailable_ids = Reservation.objects.filter(
            status__in=[ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED],
        ).filter(
            Q(reserved_at__lt=reserved_until) & Q(reserved_until__gt=reserved_at)
        ).values_list("table_id", flat=True)

        tables = self.get_queryset().filter(is_active=True, capacity__gte=party_size).exclude(id__in=unavailable_ids)
        return Response(self.get_serializer(tables, many=True).data)
