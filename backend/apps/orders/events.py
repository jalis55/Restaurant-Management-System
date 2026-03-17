from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_order_event(event_type: str, payload: dict):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "orders",
        {
            "type": "order.event",
            "payload": {
                "type": event_type,
                "order": payload,
            },
        },
    )
