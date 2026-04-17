"""Users API: session, auth, profile and public resolver endpoints."""

from __future__ import annotations

import time
from collections.abc import Mapping
from datetime import timedelta
from pathlib import Path
import secrets
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import login, logout, password_validation
from django.core.files.storage import default_storage
from django.db import OperationalError, ProgrammingError
from django.http import FileResponse, HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.decorators import api_view
from rest_framework.exceptions import ParseError, UnsupportedMediaType
from rest_framework.response import Response
from rooms.models import Room

from chat_app_django.http_utils import error_response, parse_request_payload
from chat_app_django.ip_utils import get_client_ip_from_request
from chat_app_django.media_utils import (
    is_chat_attachment_media_path,
    is_valid_media_signature,
    normalize_media_path,
    serialize_avatar_crop,
)
from chat_app_django.security.audit import audit_http_event
from chat_app_django.security.rate_limit import DbRateLimiter
from chat_app_django.security.rate_limit_config import (
    auth_rate_limit_disabled,
    auth_rate_limit_policy,
)
from chat_app_django.ws_auth import (
    issue_authenticated_ws_auth_token,
    issue_guest_ws_auth_token,
)

from users.application import auth_service
from users.application.errors import IdentityServiceError
from users.application.media_access_service import (
    MediaAccessNotFoundError,
    resolve_attachment_media_access,
    resolve_media_content_type,
)
from users.application.media_range_service import (
    InvalidByteRangeError,
    build_invalid_range_response,
    build_partial_media_response,
    open_protected_media_source,
    parse_single_byte_range_header,
)
from users.avatar_service import (
    resolve_bundled_default_avatar_file,
    resolve_user_avatar_url_from_request,
)
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
    user_public_ref,
)


AUTH_BACKEND_PATH = "users.auth_backends.EmailIdentityBackend"
GOOGLE_OAUTH_STATE_SESSION_KEY = "auth.google_oauth_state"
GOOGLE_OAUTH_RETURN_TO_SESSION_KEY = "auth.google_oauth_return_to"
UNAUTHORIZED_AVATAR_FALLBACK_MEDIA_PATH = "avatars/image not found/image_not_found.svg"
UNAUTHORIZED_AVATAR_FALLBACK_FILE_PATH = (
    Path(__file__).resolve().parent.parent
    / "media"
    / "avatars"
    / "image not found"
    / "image_not_found.svg"
)


def _build_google_oauth_redirect_uri(request) -> str:
    """Собирает абсолютный callback URL для server-side Google OAuth redirect."""
    return request.build_absolute_uri("/api/auth/oauth/google/callback/")


def _is_avatar_media_path(normalized_path: str) -> bool:
    """Проверяет, относится ли media-путь к avatar-контенту."""
    return normalized_path.startswith("avatars/")


def _resolve_unauthorized_avatar_fallback_file() -> Path | None:
    """Возвращает физический SVG-файл, который используется как avatar-fallback."""
    media_root = Path(str(getattr(settings, "MEDIA_ROOT", "") or "")).resolve()
    media_root_candidate = media_root / "avatars" / "image not found" / "image_not_found.svg"
    if media_root_candidate.exists():
        return media_root_candidate
    if UNAUTHORIZED_AVATAR_FALLBACK_FILE_PATH.exists():
        return UNAUTHORIZED_AVATAR_FALLBACK_FILE_PATH
    return None


def _anonymous_avatar_fallback_response(request) -> FileResponse | Response:
    """Возвращает placeholder-avatar для анонимного запроса к avatar-media."""
    fallback_file = _resolve_unauthorized_avatar_fallback_file()
    if fallback_file is None:
        return Response({"error": "Не найдено"}, status=404)
    return _protected_media_response(
        request,
        UNAUTHORIZED_AVATAR_FALLBACK_MEDIA_PATH,
        cache_control="public, max-age=60",
        preferred_content_type="image/svg+xml",
        file_path_override=fallback_file,
    )


def _sanitize_frontend_return_path(raw_value: object, *, fallback: str = "/login") -> str:
    """Нормализует frontend-путь возврата и не допускает open redirect."""
    candidate = str(raw_value or "").strip()
    if not candidate:
        return fallback
    if not candidate.startswith("/") or candidate.startswith("//"):
        return fallback
    return candidate


def _build_frontend_error_redirect(request, message: str) -> str:
    """Формирует безопасный redirect назад в SPA с текстом ошибки OAuth."""
    fallback_path = _sanitize_frontend_return_path(
        request.session.pop(GOOGLE_OAUTH_RETURN_TO_SESSION_KEY, None),
        fallback="/login",
    )
    separator = "&" if "?" in fallback_path else "?"
    return f"{fallback_path}{separator}oauthError={quote(message, safe='')}"


def _ensure_session_key(request) -> str:
    """Возвращает существующий session key или создает его перед выдачей WS token."""
    session = request.session
    key = getattr(session, "session_key", None)
    if key:
        return str(key)
    session.save()
    key = getattr(session, "session_key", None)
    return str(key or "")


def _build_authenticated_session_payload(request, user) -> dict[str, object]:
    """Собирает HTTP payload для авторизованной сессии вместе с WS token."""
    session_key = _ensure_session_key(request)
    return {
        "authenticated": True,
        "user": _serialize_user(request, user),
        "wsAuthToken": issue_authenticated_ws_auth_token(
            user_id=int(user.pk),
            session_key=session_key,
        ),
    }


def _build_guest_presence_payload(request) -> dict[str, object]:
    """Собирает payload bootstrap-ответа для guest presence websocket."""
    session_key = _ensure_session_key(request)
    return {
        "ok": True,
        "wsAuthToken": issue_guest_ws_auth_token(session_key=session_key),
    }


def _protected_media_response(
    request,
    normalized_path: str,
    cache_control: str,
    *,
    preferred_content_type: str | None = None,
    file_path_override: Path | None = None,
) -> FileResponse | HttpResponse:
    """Вспомогательная функция `_protected_media_response` реализует внутренний шаг бизнес-логики.
    
    Args:
        normalized_path: Параметр normalized path, используемый в логике функции.
        cache_control: Параметр cache control, используемый в логике функции.
        preferred_content_type: Параметр preferred content type, используемый в логике функции.
        file_path_override: Физический файл для fallback-выдачи без зависимости от storage backend.
    
    Returns:
        HTTP-ответ с результатом обработки.
    """
    content_type = resolve_media_content_type(
        normalized_path,
        preferred_content_type=preferred_content_type,
    )

    if not settings.DEBUG and file_path_override is None:
        response = HttpResponse(content_type=content_type)
        response["X-Accel-Redirect"] = f"/_protected_media/{quote(normalized_path, safe='/')}"
    else:
        file_obj = None
        file_size = 0
        try:
            file_obj, file_size = open_protected_media_source(
                normalized_path,
                file_path_override=file_path_override,
            )
            requested_range = parse_single_byte_range_header(
                request.headers.get("Range") or request.META.get("HTTP_RANGE"),
                file_size=file_size,
            )
            if requested_range is not None:
                response = build_partial_media_response(
                    file_obj,
                    byte_range=requested_range,
                    content_type=content_type,
                    cache_control=cache_control,
                )
                file_obj.close()
                file_obj = None
                return response

            response = FileResponse(file_obj, content_type=content_type)
            file_obj = None
        except InvalidByteRangeError:
            if file_obj is not None:
                file_obj.close()
            return build_invalid_range_response(
                file_size=file_size,
                content_type=content_type,
                cache_control=cache_control,
            )

    response["Accept-Ranges"] = "bytes"
    response["Cache-Control"] = cache_control
    return response


def _extract_payload(request) -> Mapping[str, object]:
    """Выполняет вспомогательную обработку для extract payload.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Объект типа Mapping[str, object], полученный при выполнении операции.
    """
    try:
        data = getattr(request, "data", None)
    except (ParseError, UnsupportedMediaType):
        data = None
    if isinstance(data, Mapping):
        return data
    raw_request = getattr(request, "_request", request)
    return parse_request_payload(raw_request)


def _resolve_email(user) -> str:
    """Определяет email на основе доступного контекста.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    identity = getattr(user, "email_identity", None)
    if identity and getattr(identity, "email_normalized", None):
        return identity.email_normalized
    return ""


def _serialize_user(request, user):
    """Сериализует user для передачи клиенту.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    profile = ensure_profile(user)
    profile_image = resolve_user_avatar_url_from_request(request, user)

    last_seen = getattr(profile, "last_seen", None)
    handle = user_public_handle(user)
    public_id = user_public_id(user)

    return {
        "id": user.pk,
        "name": (getattr(profile, "name", "") or "").strip(),
        "handle": handle,
        "publicId": public_id,
        "publicRef": user_public_ref(user),
        "isSuperuser": bool(getattr(user, "is_superuser", False)),
        "email": _resolve_email(user),
        "profileImage": profile_image,
        "avatarCrop": serialize_avatar_crop(profile),
        "bio": getattr(profile, "bio", "") or "",
        "lastSeen": last_seen.isoformat() if last_seen else None,
        "registeredAt": user.date_joined.isoformat() if getattr(user, "date_joined", None) else None,
    }


def _serialize_public_user(request, user):
    """Сериализует public user для передачи клиенту.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    payload = _serialize_user(request, user)
    payload["email"] = ""
    return payload


def _get_client_ip(request) -> str:
    """Возвращает client ip из текущего контекста.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return get_client_ip_from_request(request) or ""


def _rate_limited(request, action: str) -> bool:
    """Вспомогательная функция `_rate_limited` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        action: Код или имя действия, которое фиксируется в аудите.
    
    Returns:
        Логическое значение результата проверки.
    """
    if auth_rate_limit_disabled():
        return False

    ip = _get_client_ip(request) or "unknown"
    scope_key = f"rl:auth:{action}:{ip}"
    policy = auth_rate_limit_policy()
    return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)


def _identity_error_response(exc: IdentityServiceError) -> Response:
    """Вспомогательная функция `_identity_error_response` реализует внутренний шаг бизнес-логики.
    
    Args:
        exc: Параметр exc, используемый в логике функции.
    
    Returns:
        HTTP-ответ с результатом обработки.
    """
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
    """Вспомогательная функция `csrf_token` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    return Response({"csrfToken": get_token(request)})


@ensure_csrf_cookie
@api_view(["GET"])
def session_view(request):
    """Обрабатывает API-представление для session.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        return Response(_build_authenticated_session_payload(request, user))
    return Response({"authenticated": False, "user": None, "wsAuthToken": None})


@ensure_csrf_cookie
@api_view(["GET"])
def presence_session_view(request):
    """Обрабатывает API-представление для presence session.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    request.session.modified = True
    audit_http_event("presence.session.bootstrap", request)
    return Response(_build_guest_presence_payload(request))


@api_view(["GET"])
def password_rules_view(request):
    """Обрабатывает API-представление для password rules.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    rules = [str(rule) for rule in password_validation.password_validators_help_texts()]
    return Response({"rules": rules})


@csrf_protect
@api_view(["POST"])
def login_view(request):
    """Обрабатывает API-представление для login.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    return Response(_build_authenticated_session_payload(request, user))


@csrf_protect
@api_view(["POST"])
def logout_view(request):
    """Обрабатывает API-представление для logout.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Обрабатывает API-представление для register.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    return Response(_build_authenticated_session_payload(request, user), status=201)


@csrf_protect
@api_view(["POST"])
def oauth_google_view(request):
    """Обрабатывает API-представление для oauth google.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    return Response(_build_authenticated_session_payload(request, user))


@api_view(["GET"])
def oauth_google_start_view(request):
    """Запускает server-side redirect flow для входа через Google OAuth."""
    if not auth_service.google_oauth_redirect_is_configured():
        audit_http_event("auth.oauth.google.redirect.failed", request, reason="oauth_not_configured")
        return error_response(status=503, error="Google OAuth не настроен")

    state = secrets.token_urlsafe(32)
    redirect_uri = _build_google_oauth_redirect_uri(request)
    frontend_return_to = _sanitize_frontend_return_path(
        request.GET.get("next"),
        fallback="/login",
    )

    request.session[GOOGLE_OAUTH_STATE_SESSION_KEY] = state
    request.session[GOOGLE_OAUTH_RETURN_TO_SESSION_KEY] = frontend_return_to
    request.session.modified = True

    authorization_url = auth_service.build_google_authorization_url(
        state=state,
        redirect_uri=redirect_uri,
    )
    audit_http_event("auth.oauth.google.redirect.started", request)
    return HttpResponseRedirect(authorization_url)


@api_view(["GET"])
def oauth_google_callback_view(request):
    """Принимает callback Google OAuth, создает сессию и возвращает пользователя в SPA."""
    expected_state = str(request.session.pop(GOOGLE_OAUTH_STATE_SESSION_KEY, "") or "").strip()
    frontend_return_to = _sanitize_frontend_return_path(
        request.session.get(GOOGLE_OAUTH_RETURN_TO_SESSION_KEY),
        fallback="/login",
    )

    error_code = str(request.GET.get("error") or "").strip()
    if error_code:
        audit_http_event("auth.oauth.google.redirect.failed", request, reason=error_code)
        message = "Вход через Google был отменен."
        if error_code not in {"access_denied", "user_cancelled"}:
            message = "Не удалось выполнить вход через Google."
        return HttpResponseRedirect(_build_frontend_error_redirect(request, message))

    code = str(request.GET.get("code") or "").strip()
    state = str(request.GET.get("state") or "").strip()
    if not expected_state or not state or state != expected_state or not code:
        audit_http_event("auth.oauth.google.redirect.failed", request, reason="invalid_callback")
        return HttpResponseRedirect(
            _build_frontend_error_redirect(
                request,
                "Не удалось подтвердить вход через Google.",
            )
        )

    redirect_uri = _build_google_oauth_redirect_uri(request)
    try:
        user = auth_service.authenticate_or_signup_with_google_authorization_code(
            code=code,
            redirect_uri=redirect_uri,
        )
    except IdentityServiceError as exc:
        audit_http_event("auth.oauth.google.redirect.failed", request, reason=exc.code)
        return HttpResponseRedirect(_build_frontend_error_redirect(request, exc.message))

    request.session.pop(GOOGLE_OAUTH_RETURN_TO_SESSION_KEY, None)
    login(request, user, backend=AUTH_BACKEND_PATH)
    audit_http_event("auth.oauth.google.redirect.success", request, public_ref=user_public_ref(user))

    if frontend_return_to in {"/login", "/register"}:
        frontend_return_to = "/"
    return HttpResponseRedirect(frontend_return_to)


@api_view(["GET"])
def media_view(request, file_path: str):
    """Обрабатывает API-представление для media.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        file_path: Параметр file path, используемый в логике функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    normalized_path = normalize_media_path(file_path)
    if not normalized_path:
        return Response({"error": "Не найдено"}, status=404)
    is_anonymous_avatar_request = (
        _is_avatar_media_path(normalized_path)
        and not getattr(getattr(request, "user", None), "is_authenticated", False)
    )

    if is_chat_attachment_media_path(normalized_path):
        if request.GET.get("exp") is not None or request.GET.get("sig") is not None:
            return Response({"error": "Не найдено"}, status=404)

        try:
            access = resolve_attachment_media_access(
                normalized_path=normalized_path,
                room_id_raw=request.GET.get("roomId"),
                user=getattr(request, "user", None),
            )
        except MediaAccessNotFoundError:
            return Response({"error": "Не найдено"}, status=404)

        return _protected_media_response(
            request,
            normalized_path,
            cache_control="private, no-store",
            preferred_content_type=access.preferred_content_type,
        )

    exp_raw = request.GET.get("exp")
    signature = request.GET.get("sig")
    should_fallback_to_avatar_placeholder = (
        is_anonymous_avatar_request
        and (not str(exp_raw or "").strip() or not str(signature or "").strip())
    )
    try:
        expires_at = int(exp_raw)  
    except (TypeError, ValueError):
        if should_fallback_to_avatar_placeholder:
            return _anonymous_avatar_fallback_response(request)
        audit_http_event("media.signature.invalid", request, path=file_path, reason="invalid_exp")
        return Response({"error": "Доступ запрещен"}, status=403)

    now = int(time.time())
    if expires_at < now:
        audit_http_event("media.signature.expired", request, path=normalized_path)
        return Response({"error": "Доступ запрещен"}, status=403)

    if not is_valid_media_signature(normalized_path, expires_at, signature):
        audit_http_event("media.signature.invalid", request, path=normalized_path, reason="bad_signature")
        return Response({"error": "Доступ запрещен"}, status=403)

    # Built-in default avatars must keep working even when MEDIA_ROOT is empty in production.
    bundled_default_avatar = resolve_bundled_default_avatar_file(normalized_path)
    if not default_storage.exists(normalized_path) and bundled_default_avatar is None:
        return Response({"error": "Не найдено"}, status=404)

    cache_seconds = max(0, expires_at - now)
    return _protected_media_response(
        request,
        normalized_path,
        cache_control=f"private, max-age={cache_seconds}",
        file_path_override=bundled_default_avatar,
    )


@csrf_protect
@api_view(["GET", "PATCH"])
def profile_view(request):
    """Обрабатывает API-представление для profile.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Обрабатывает API-представление для profile handle.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Обрабатывает API-представление для security settings.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Обрабатывает API-представление для public resolve.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        ref: Параметр ref, используемый в логике функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
