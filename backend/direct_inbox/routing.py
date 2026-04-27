"""WebSocket routing for direct inbox consumers."""

from typing import Any, cast

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/inbox/$", cast(Any, consumers.DirectInboxConsumer.as_asgi())),
]
