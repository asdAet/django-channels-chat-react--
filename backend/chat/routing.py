"""WebSocket routing for chat consumers."""

from typing import Any, cast

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    # Accept full tail and let ChatConsumer validate room slug explicitly.
    re_path(r"ws/chat/(?P<room_name>.+)/$", cast(Any, consumers.ChatConsumer.as_asgi())),
    re_path(r"ws/presence/$", cast(Any, consumers.PresenceConsumer.as_asgi())),
    re_path(r"ws/direct/inbox/$", cast(Any, consumers.DirectInboxConsumer.as_asgi())),
]
