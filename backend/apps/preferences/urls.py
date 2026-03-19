from django.urls import path

from apps.preferences.views import BillingSettingsView


urlpatterns = [
    path("billing/", BillingSettingsView.as_view(), name="billing-settings"),
]
