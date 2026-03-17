import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.authentication import JWTAuthentication


class OrderConsumer(AsyncWebsocketConsumer):
    group_name = "orders"

    async def connect(self):
        token = parse_qs(self.scope["query_string"].decode()).get("token", [None])[0]
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

    @database_sync_to_async
    def get_user(self, token):
        if not token:
            return None
        try:
            validated = JWTAuthentication().get_validated_token(token)
            return JWTAuthentication().get_user(validated)
        except Exception:
            return None
