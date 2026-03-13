"""WebSocket routing for chat consumers."""

from typing import Any, cast

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>.+)/$", cast(Any, consumers.ChatConsumer.as_asgi())),
]
