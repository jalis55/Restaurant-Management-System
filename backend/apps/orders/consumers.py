import json
from http.cookies import SimpleCookie
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class OrderConsumer(AsyncWebsocketConsumer):
    group_name = "orders"

    async def connect(self):
        token = self.get_access_token()
        user = await self.get_user(token)
        if not user or not user.is_authenticated:
            await self.close()
            return
        self.scope["user"] = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def order_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    def get_access_token(self):
        query_token = parse_qs(self.scope["query_string"].decode()).get("token", [None])[0]
        if query_token:
            return query_token

        cookie_header = dict(self.scope.get("headers", [])).get(b"cookie")
        if not cookie_header:
            return None

        cookies = SimpleCookie()
        cookies.load(cookie_header.decode())
        access_cookie = cookies.get(settings.AUTH_COOKIE_ACCESS)
        return access_cookie.value if access_cookie else None

    @database_sync_to_async
    def get_user(self, token):
        if not token:
            return None
        try:
            validated = JWTAuthentication().get_validated_token(token)
            return JWTAuthentication().get_user(validated)
        except Exception:
            return None
