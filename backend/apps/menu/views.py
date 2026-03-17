from django.db.models import Count, Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrManager, IsStaffRole
from apps.menu.filters import MenuItemFilter
from apps.menu.models import Category, MenuItem
from apps.menu.serializers import CategoryDetailSerializer, CategorySerializer, MenuItemSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().annotate(items_count=Count("items"))
    serializer_class = CategorySerializer
    search_fields = ["name", "description"]
    ordering_fields = ["display_order", "name", "created_at"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "items"}:
            permission_classes = [IsAuthenticated, IsStaffRole]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "retrieve":
            return queryset.prefetch_related(Prefetch("items", queryset=MenuItem.objects.order_by("display_order", "name")))
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CategoryDetailSerializer
        return CategorySerializer

    @action(detail=True, methods=["get"])
    def items(self, request, pk=None):
        category = self.get_object()
        serializer = MenuItemSerializer(category.items.all().order_by("display_order", "name"), many=True)
        return Response(serializer.data)


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    filterset_class = MenuItemFilter
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["display_order", "name", "price", "created_at"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "featured"}:
            permission_classes = [IsAuthenticated, IsStaffRole]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["get"])
    def featured(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(is_featured=True, is_available=True))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def toggle_availability(self, request, pk=None):
        item = self.get_object()
        item.is_available = not item.is_available
        item.save(update_fields=["is_available"])
        return Response(self.get_serializer(item).data, status=status.HTTP_200_OK)
