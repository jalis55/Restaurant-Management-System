from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def _set_auth_cookies(response, access_token=None, refresh_token=None):
    secure = settings.AUTH_COOKIE_SECURE
    samesite = settings.AUTH_COOKIE_SAMESITE

    if access_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS,
            value=access_token,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/",
        )

    if refresh_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value=refresh_token,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/api/auth/token/refresh/",
        )


def _clear_auth_cookies(response):
    samesite = settings.AUTH_COOKIE_SAMESITE

    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS,
        path="/",
        samesite=samesite,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH,
        path="/api/auth/token/refresh/",
        samesite=samesite,
    )


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data.get("access")
        refresh_token = serializer.validated_data.get("refresh")
        response = Response({"detail": "Login successful."}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        serializer = self.get_serializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data.get("access")
        new_refresh_token = serializer.validated_data.get("refresh")
        response = Response({"detail": "Token refreshed successfully."}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access_token=access_token, refresh_token=new_refresh_token)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response
