"""Meta endpoints for frontend runtime configuration and lightweight telemetry."""

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from chat_app_django.http_utils import error_response, parse_request_payload
from chat_app_django.security.audit import audit_http_event
from chat_app_django.visitor_telemetry import normalize_visit_payload
from users.application.auth_service import google_oauth_redirect_is_configured


@api_view(["GET"])
@permission_classes([AllowAny])
def client_config_view(_request):
    """Возвращает runtime-конфигурацию, которую фронтенд читает при загрузке."""

    allow_any_type = bool(getattr(settings, "CHAT_ATTACHMENT_ALLOW_ANY_TYPE", True))
    google_oauth_client_id = ""
    if google_oauth_redirect_is_configured():
        google_oauth_client_id = str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or "")
    return Response(
        {
            "usernameMaxLength": int(getattr(settings, "USERNAME_MAX_LENGTH", 30)),
            "chatMessageMaxLength": int(getattr(settings, "CHAT_MESSAGE_MAX_LENGTH", 1000)),
            "chatTargetRegex": str(
                getattr(settings, "CHAT_TARGET_REGEX", r"^[A-Za-z0-9_@-]{1,60}$")
            ),
            "chatAttachmentMaxSizeMb": int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10)),
            "chatAttachmentMaxPerMessage": int(
                getattr(settings, "CHAT_ATTACHMENT_MAX_PER_MESSAGE", 10)
            ),
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
            "googleOAuthClientId": google_oauth_client_id,
        }
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def site_visit_view(request):
    """Принимает visitor-event с фронтенда и пишет его в audit-поток."""

    payload = parse_request_payload(request)
    visit_fields = normalize_visit_payload(
        payload,
        user_agent=request.META.get("HTTP_USER_AGENT"),
    )
    if visit_fields is None:
        return error_response(status=400, error="Некорректные данные visitor telemetry")

    audit_http_event("site.visit", request, **visit_fields)
    return Response(status=204)
