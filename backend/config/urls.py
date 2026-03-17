from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from apps.accounts.token_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView
from apps.accounts.views import UserViewSet
from apps.menu.views import CategoryViewSet, MenuItemViewSet
from apps.orders.views import OrderViewSet
from apps.reservations.views import ReservationViewSet, TableViewSet

auth_router = DefaultRouter()
auth_router.register("users", UserViewSet, basename="user")

api_router = DefaultRouter()
api_router.register("menu/categories", CategoryViewSet, basename="menu-category")
api_router.register("menu/items", MenuItemViewSet, basename="menu-item")
api_router.register("orders", OrderViewSet, basename="order")
api_router.register("reservations", ReservationViewSet, basename="reservation")
api_router.register("reservations/tables", TableViewSet, basename="table")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/auth/token/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("api/auth/", include(auth_router.urls)),
    path("api/", include(api_router.urls)),
    path("api/reports/", include("apps.reports.urls")),
]
