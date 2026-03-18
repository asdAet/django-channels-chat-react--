"""Users API: session, auth, profile and public resolver endpoints."""

from __future__ import annotations

import time
from collections.abc import Mapping
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import login, logout, password_validation
from django.core.files.storage import default_storage
from django.db import OperationalError, ProgrammingError
from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.decorators import api_view
from rest_framework.exceptions import ParseError, UnsupportedMediaType
from rest_framework.response import Response
from messages.models import MessageAttachment
from roles.access import ensure_can_read_or_404
from rooms.models import Room

from chat_app_django.http_utils import error_response, parse_request_payload
from chat_app_django.ip_utils import get_client_ip_from_request
from chat_app_django.media_utils import (
    build_profile_url_from_request,
    is_chat_attachment_media_path,
    is_valid_media_signature,
    normalize_media_path,
    serialize_avatar_crop,
)
from chat_app_django.security.audit import audit_http_event
from chat_app_django.security.rate_limit import DbRateLimiter
from chat_app_django.security.rate_limit_config import auth_rate_limit_policy

from users.application import auth_service
from users.application.errors import IdentityServiceError
from users.forms import ProfileUpdateForm
from users.identity import (
    ensure_profile,
    ensure_user_identity_core,
    resolve_public_ref,
    room_public_handle,
    room_public_id,
    room_public_ref,
    user_public_handle,
    user_public_id,
    user_profile_avatar_source,
    user_public_ref,
)


AUTH_BACKEND_PATH = "users.auth_backends.EmailIdentityBackend"


def _protected_media_response(normalized_path: str, cache_control: str) -> FileResponse | HttpResponse:
    if settings.DEBUG:
        response: FileResponse | HttpResponse = FileResponse(default_storage.open(normalized_path, "rb"))
    else:
        response = HttpResponse()
        response["X-Accel-Redirect"] = f"/_protected_media/{quote(normalized_path, safe='/')}"
    response["Cache-Control"] = cache_control
    return response


def _extract_payload(request) -> Mapping[str, object]:
    try:
        data = getattr(request, "data", None)
    except (ParseError, UnsupportedMediaType):
        data = None
    if isinstance(data, Mapping):
        return data
    raw_request = getattr(request, "_request", request)
    return parse_request_payload(raw_request)


def _resolve_email(user) -> str:
    identity = getattr(user, "email_identity", None)
    if identity and getattr(identity, "email_normalized", None):
        return identity.email_normalized
    return ""


def _serialize_user(request, user):
    profile = ensure_profile(user)
    profile_image = None
    avatar_source = user_profile_avatar_source(user)
    if avatar_source:
        if avatar_source.startswith("http://") or avatar_source.startswith("https://"):
            profile_image = avatar_source
        else:
            profile_image = build_profile_url_from_request(request, avatar_source)

    last_seen = getattr(profile, "last_seen", None)
    handle = user_public_handle(user)
    public_id = user_public_id(user)

    return {
        "id": user.pk,
        "name": (getattr(profile, "name", "") or "").strip(),
        "handle": handle,
        "publicId": public_id,
        "publicRef": user_public_ref(user),
        "email": _resolve_email(user),
        "profileImage": profile_image,
        "avatarCrop": serialize_avatar_crop(profile),
        "bio": getattr(profile, "bio", "") or "",
        "lastSeen": last_seen.isoformat() if last_seen else None,
        "registeredAt": user.date_joined.isoformat() if getattr(user, "date_joined", None) else None,
    }


def _serialize_public_user(request, user):
    payload = _serialize_user(request, user)
    payload["email"] = ""
    return payload


def _get_client_ip(request) -> str:
    return get_client_ip_from_request(request) or ""


def _rate_limited(request, action: str) -> bool:
    ip = _get_client_ip(request) or "unknown"
    scope_key = f"rl:auth:{action}:{ip}"
    policy = auth_rate_limit_policy()
    return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)


def _identity_error_response(exc: IdentityServiceError) -> Response:
    payload: dict[str, object] = {
        "code": exc.code,
        "message": exc.message,
    }
    if exc.errors:
        payload["errors"] = exc.errors
    return Response(payload, status=exc.status_code)


@ensure_csrf_cookie
@api_view(["GET"])
def csrf_token(request):
    return Response({"csrfToken": get_token(request)})


@ensure_csrf_cookie
@api_view(["GET"])
def session_view(request):
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        return Response({"authenticated": True, "user": _serialize_user(request, user)})
    return Response({"authenticated": False, "user": None})


@ensure_csrf_cookie
@api_view(["GET"])
def presence_session_view(request):
    if not request.session.session_key:
        request.session.create()
    request.session.modified = True
    audit_http_event("presence.session.bootstrap", request)
    return Response({"ok": True})


@api_view(["GET"])
def password_rules_view(request):
    rules = [str(rule) for rule in password_validation.password_validators_help_texts()]
    return Response({"rules": rules})


@csrf_protect
@api_view(["POST"])
def login_view(request):
    if _rate_limited(request, "login"):
        audit_http_event("auth.login.rate_limited", request)
        return error_response(status=429, error="Слишком много попыток")

    payload = _extract_payload(request)
    identifier = str(payload.get("identifier") or "").strip()
    password = str(payload.get("password") or "")

    if not identifier or not password:
        audit_http_event("auth.login.failed", request, reason="missing_credentials")
        return error_response(
            status=400,
            error="Укажите identifier и пароль",
            errors={"credentials": ["Укажите identifier и пароль"]},
        )

    try:
        user = auth_service.login_user(identifier, password)
    except IdentityServiceError as exc:
        audit_http_event("auth.login.failed", request, reason=exc.code)
        return _identity_error_response(exc)

    login(request, user, backend=AUTH_BACKEND_PATH)
    audit_http_event("auth.login.success", request, public_ref=user_public_ref(user))
    return Response({"authenticated": True, "user": _serialize_user(request, user)})


@csrf_protect
@api_view(["POST"])
def logout_view(request):
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        try:
            profile = ensure_profile(user)
            profile.last_seen = timezone.now() - timedelta(minutes=5)
            profile.save(update_fields=["last_seen"])
        except (OperationalError, ProgrammingError):
            pass

    logout(request)
    audit_http_event("auth.logout", request)
    return Response({"ok": True})


@csrf_protect
@api_view(["POST"])
def register_view(request):
    if _rate_limited(request, "register"):
        audit_http_event("auth.register.rate_limited", request)
        return error_response(status=429, error="Слишком много попыток")

    payload = _extract_payload(request)

    login_value = str(payload.get("login") or "")
    password = str(payload.get("password") or "")
    password_confirm = str(payload.get("passwordConfirm") or "")
    name = str(payload.get("name") or "")
    username = payload.get("username")
    email = payload.get("email")

    username_value = username if isinstance(username, str) else None
    email_value = email if isinstance(email, str) else None

    try:
        user = auth_service.register_user(
            login=login_value,
            password=password,
            password_confirm=password_confirm,
            name=name,
            username=username_value,
            email=email_value,
        )
    except IdentityServiceError as exc:
        audit_http_event("auth.register.failed", request, reason=exc.code)
        return _identity_error_response(exc)

    login(request, user, backend=AUTH_BACKEND_PATH)
    audit_http_event("auth.register.success", request, public_ref=user_public_ref(user))
    return Response({"authenticated": True, "user": _serialize_user(request, user)}, status=201)


@csrf_protect
@api_view(["POST"])
def oauth_google_view(request):
    payload = _extract_payload(request)
    id_token = str(payload.get("idToken") or "").strip() or None
    access_token = str(payload.get("accessToken") or "").strip() or None
    username = payload.get("username")
    username_value = username if isinstance(username, str) else None

    try:
        user = auth_service.authenticate_or_signup_with_google(
            id_token=id_token,
            access_token=access_token,
            username=username_value,
        )
    except IdentityServiceError as exc:
        audit_http_event("auth.oauth.google.failed", request, reason=exc.code)
        return _identity_error_response(exc)

    login(request, user, backend=AUTH_BACKEND_PATH)
    audit_http_event("auth.oauth.google.success", request, public_ref=user_public_ref(user))
    return Response({"authenticated": True, "user": _serialize_user(request, user)})


@api_view(["GET"])
def media_view(request, file_path: str):
    normalized_path = normalize_media_path(file_path)
    if not normalized_path:
        return Response({"error": "Не найдено"}, status=404)

    if is_chat_attachment_media_path(normalized_path):
        room_id_raw = request.GET.get("roomId")
        try:
            room_id = int(room_id_raw)  
        except (TypeError, ValueError):
            return Response({"error": "Не найдено"}, status=404)
        if room_id < 1:
            return Response({"error": "Не найдено"}, status=404)
        if request.GET.get("exp") is not None or request.GET.get("sig") is not None:
            return Response({"error": "Не найдено"}, status=404)

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return Response({"error": "Не найдено"}, status=404)

        room = Room.objects.filter(pk=room_id).first()
        if room is None:
            return Response({"error": "Не найдено"}, status=404)
        try:
            ensure_can_read_or_404(room, user)
        except Http404:
            return Response({"error": "Не найдено"}, status=404)

        belongs_to_room = MessageAttachment.objects.filter(
            message__room_id=room_id,
            message__is_deleted=False,
        ).filter(
            Q(file=normalized_path) | Q(thumbnail=normalized_path)
        ).exists()
        if not belongs_to_room:
            return Response({"error": "Не найдено"}, status=404)

        if not default_storage.exists(normalized_path):
            return Response({"error": "Не найдено"}, status=404)

        return _protected_media_response(normalized_path, cache_control="private, no-store")

    exp_raw = request.GET.get("exp")
    signature = request.GET.get("sig")
    try:
        expires_at = int(exp_raw)  
    except (TypeError, ValueError):
        audit_http_event("media.signature.invalid", request, path=file_path, reason="invalid_exp")
        return Response({"error": "Доступ запрещен"}, status=403)

    now = int(time.time())
    if expires_at < now:
        audit_http_event("media.signature.expired", request, path=normalized_path)
        return Response({"error": "Доступ запрещен"}, status=403)

    if not is_valid_media_signature(normalized_path, expires_at, signature):
        audit_http_event("media.signature.invalid", request, path=normalized_path, reason="bad_signature")
        return Response({"error": "Доступ запрещен"}, status=403)

    if not default_storage.exists(normalized_path):
        return Response({"error": "Не найдено"}, status=404)

    cache_seconds = max(0, expires_at - now)
    return _protected_media_response(normalized_path, cache_control=f"private, max-age={cache_seconds}")


@csrf_protect
@api_view(["GET", "PATCH"])
def profile_view(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return error_response(status=401, error="Требуется авторизация")

    profile = ensure_profile(user)

    if request.method == "GET":
        return Response({"user": _serialize_user(request, user)})

    payload = _extract_payload(request)
    errors: dict[str, list[str]] = {}

    if "name" in payload:
        raw_name = str(payload.get("name") or "")
        next_name = strip_tags(raw_name).strip()
        if len(next_name) > 150:
            errors["name"] = ["Максимум 150 символов"]
        else:
            auth_service.set_profile_name(user, next_name)

    media_form = ProfileUpdateForm(payload, request.FILES, instance=profile)
    if media_form.is_valid():
        media_form.save()
    else:
        form_errors = media_form.errors or {}
        for field, field_errors in form_errors.items():
            errors[field] = [str(error_item) for error_item in field_errors]

    if errors:
        audit_http_event("auth.profile.update.failed", request, public_ref=user_public_ref(user), errors=errors)
        return error_response(status=400, errors=errors)

    audit_http_event("auth.profile.update.success", request, public_ref=user_public_ref(user))
    return Response({"user": _serialize_user(request, user)})


@csrf_protect
@api_view(["PATCH"])
def profile_handle_view(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return error_response(status=401, error="Требуется авторизация")

    payload = _extract_payload(request)
    username = payload.get("username")
    username_value = username if isinstance(username, str) else None

    try:
        auth_service.set_public_handle(user, username_value)
    except IdentityServiceError as exc:
        return _identity_error_response(exc)

    return Response({"user": _serialize_user(request, user)})


@csrf_protect
@api_view(["GET", "PATCH"])
def security_settings_view(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return error_response(status=401, error="Требуется авторизация")

    if request.method == "GET":
        return Response({"security": auth_service.get_security_settings(user)})

    payload = _extract_payload(request)
    raw_email = payload.get("email")
    raw_password = payload.get("newPassword")
    raw_verify_email = payload.get("verifyEmail")
    raw_unlink_provider = payload.get("unlinkOAuthProvider")

    email_value = raw_email if isinstance(raw_email, str) else None
    password_value = raw_password if isinstance(raw_password, str) else None
    verify_email_value = bool(raw_verify_email) if "verifyEmail" in payload else None
    unlink_provider_value = raw_unlink_provider if isinstance(raw_unlink_provider, str) else None

    try:
        auth_service.update_security_settings(
            user,
            email=email_value if "email" in payload else None,
            verify_email=verify_email_value,
            new_password=password_value if "newPassword" in payload else None,
            unlink_oauth_provider=unlink_provider_value if "unlinkOAuthProvider" in payload else None,
        )
    except IdentityServiceError as exc:
        return _identity_error_response(exc)

    return Response(
        {
            "ok": True,
            "security": auth_service.get_security_settings(user),
            "user": _serialize_user(request, user),
        }
    )


@api_view(["GET"])
def public_resolve_view(request, ref: str):
    owner_type, owner = resolve_public_ref(ref)
    if owner is None or owner_type is None:
        return Response({"error": "Не найдено"}, status=404)

    if owner_type == "user":
        if isinstance(owner, Room):
            return Response({"error": "Не найдено"}, status=404)
        return Response(
            {
                "ownerType": "user",
                "ownerId": owner.pk,
                "publicRef": user_public_ref(owner),
                "handle": user_public_handle(owner),
                "publicId": ensure_user_identity_core(owner).public_id,
                "user": _serialize_public_user(request, owner),
            }
        )

    if not isinstance(owner, Room):
        return Response({"error": "Не найдено"}, status=404)

    return Response(
        {
            "ownerType": "group",
            "ownerId": owner.pk,
            "publicRef": room_public_ref(owner),
            "handle": room_public_handle(owner),
            "publicId": room_public_id(owner),
        }
    )
