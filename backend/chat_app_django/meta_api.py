"""Read-only meta endpoints for frontend runtime configuration."""

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def client_config_view(_request):
    """Returns client-facing limits and policies from backend settings."""
    return Response(
        {
            "usernameMaxLength": int(getattr(settings, "USERNAME_MAX_LENGTH", 30)),
            "chatMessageMaxLength": int(getattr(settings, "CHAT_MESSAGE_MAX_LENGTH", 1000)),
            "chatRoomSlugRegex": str(
                getattr(settings, "CHAT_ROOM_SLUG_REGEX", r"^[A-Za-z0-9_-]{3,50}$")
            ),
            "chatAttachmentMaxSizeMb": int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10)),
            "chatAttachmentMaxPerMessage": int(getattr(settings, "CHAT_ATTACHMENT_MAX_PER_MESSAGE", 5)),
            "chatAttachmentAllowedTypes": [
                str(item)
                for item in getattr(settings, "CHAT_ATTACHMENT_ALLOWED_TYPES", [])
                if str(item).strip()
            ],
            "mediaUrlTtlSeconds": int(getattr(settings, "MEDIA_URL_TTL_SECONDS", 300)),
            "mediaMode": "signed_only",
            "googleOAuthClientId": str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""),
        }
    )
