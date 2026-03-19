from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrManager
from apps.preferences.models import BillingSettings
from apps.preferences.serializers import BillingSettingsSerializer


class BillingSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @extend_schema(tags=["settings"], responses=BillingSettingsSerializer)
    def get(self, request):
        serializer = BillingSettingsSerializer(BillingSettings.get_solo())
        return Response(serializer.data)

    @extend_schema(tags=["settings"], request=BillingSettingsSerializer, responses=BillingSettingsSerializer)
    def patch(self, request):
        settings = BillingSettings.get_solo()
        serializer = BillingSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
