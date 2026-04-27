"""ASGI config for chat_app_django."""

import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_app_django.settings')
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import chat.routing
import presence.routing
import direct_inbox.routing
from chat_app_django.ws_auth_middleware import WebSocketTokenAuthMiddleware

websocket_urlpatterns = (
    chat.routing.websocket_urlpatterns
    + presence.routing.websocket_urlpatterns
    + direct_inbox.routing.websocket_urlpatterns
)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            WebSocketTokenAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        )
    )
})
