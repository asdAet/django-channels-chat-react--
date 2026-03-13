"""WebSocket routing for presence consumers."""

from typing import Any, cast

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/presence/$", cast(Any, consumers.PresenceConsumer.as_asgi())),
]
