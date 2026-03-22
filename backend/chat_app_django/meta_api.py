"""Read-only meta endpoints for frontend runtime configuration."""

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def client_config_view(_request):
    """Обрабатывает API-представление для client config.
    
    Args:
        _request: HTTP-запрос, не используемый напрямую в теле функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    allow_any_type = bool(getattr(settings, "CHAT_ATTACHMENT_ALLOW_ANY_TYPE", True))
    return Response(
        {
            "usernameMaxLength": int(getattr(settings, "USERNAME_MAX_LENGTH", 30)),
            "chatMessageMaxLength": int(getattr(settings, "CHAT_MESSAGE_MAX_LENGTH", 1000)),
            "chatTargetRegex": str(
                getattr(settings, "CHAT_TARGET_REGEX", r"^[A-Za-z0-9_@-]{1,60}$")
            ),
            "chatAttachmentMaxSizeMb": int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10)),
            "chatAttachmentMaxPerMessage": int(getattr(settings, "CHAT_ATTACHMENT_MAX_PER_MESSAGE", 5)),
            "chatAttachmentAllowedTypes": (
                []
                if allow_any_type
                else [
                    str(item)
                    for item in getattr(settings, "CHAT_ATTACHMENT_ALLOWED_TYPES", [])
                    if str(item).strip()
                ]
            ),
            "mediaUrlTtlSeconds": int(getattr(settings, "MEDIA_URL_TTL_SECONDS", 300)),
            "mediaMode": "signed_only",
            "googleOAuthClientId": str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""),
        }
    )
