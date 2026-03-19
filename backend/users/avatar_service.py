"""Единый сервис выбора источника аватара и сборки URL."""

from __future__ import annotations

from collections.abc import Sized
from pathlib import PurePosixPath
from typing import Any

from django.conf import settings

from chat_app_django.media_utils import (
    build_profile_url,
    build_profile_url_from_request,
    normalize_media_path,
)

_DEFAULT_USER_PASSWORD_AVATAR = "avatars/Password_defualt.jpg"
_DEFAULT_USER_OAUTH_AVATAR = "avatars/OAuth_defualt.jpg"
_DEFAULT_GROUP_AVATAR = "avatars/Group_defualt.jpg"
_DEFAULT_USER_UPLOAD_DIR = "avatars/users"
_DEFAULT_GROUP_UPLOAD_DIR = "avatars/groups"
_USER_DEFAULT_IMAGE_ALIASES = (
    "default.jpg",
    "avatars/users/password/default.jpg",
    "avatars/users/oauth/default.jpg",
)


def _trimmed(value: Any) -> str:
    """Приводит значение к строке и обрезает пробелы."""
    return str(value or "").strip()


def _normalized_media_path(value: str | None) -> str:
    """Нормализует путь к media и гарантирует строковый результат."""
    normalized = normalize_media_path(value)
    return normalized or ""


def _setting_media_path(name: str, default: str) -> str:
    """Читает путь из настроек и возвращает безопасное значение."""
    configured = _trimmed(getattr(settings, name, default))
    normalized = _normalized_media_path(configured)
    if normalized:
        return normalized
    return _normalized_media_path(default)


def _setting_media_dir(name: str, default: str) -> str:
    """Читает директорию из настроек и убирает ведущие слеши."""
    value = _setting_media_path(name, default).strip("/")
    return value or default.strip("/")


def user_password_default_avatar_path() -> str:
    return _setting_media_path("USER_PASSWORD_DEFAULT_AVATAR", _DEFAULT_USER_PASSWORD_AVATAR)


def user_oauth_default_avatar_path() -> str:
    return _setting_media_path("USER_OAUTH_DEFAULT_AVATAR", _DEFAULT_USER_OAUTH_AVATAR)


def group_default_avatar_path() -> str:
    return _setting_media_path("GROUP_DEFAULT_AVATAR", _DEFAULT_GROUP_AVATAR)


def user_avatar_upload_dir() -> str:
    return _setting_media_dir("USER_AVATAR_UPLOAD_DIR", _DEFAULT_USER_UPLOAD_DIR)


def group_avatar_upload_dir() -> str:
    return _setting_media_dir("GROUP_AVATAR_UPLOAD_DIR", _DEFAULT_GROUP_UPLOAD_DIR)


def _safe_upload_filename(filename: str | None) -> str:
    name = PurePosixPath(_trimmed(filename).replace("\\", "/")).name
    if not name or name in {".", ".."}:
        return "avatar"
    return name


def user_has_oauth_identity(user: Any) -> bool:
    """Проверяет наличие OAuth-идентичности у пользователя."""
    if user is None:
        return False
    user_pk = getattr(user, "pk", None)
    if user_pk is None:
        return False

    prefetched_cache = getattr(user, "_prefetched_objects_cache", None)
    if isinstance(prefetched_cache, dict) and "oauth_identities" in prefetched_cache:
        prefetched = prefetched_cache.get("oauth_identities")
        if isinstance(prefetched, Sized):
            return len(prefetched) > 0
        return bool(prefetched)

    manager = getattr(user, "oauth_identities", None)
    if manager is None or not hasattr(manager, "exists"):
        return False
    try:
        return bool(manager.exists())
    except Exception:  # noqa: BLE001
        return False


def profile_avatar_upload_to(profile, filename: str) -> str:
    """Формирует путь сохранения пользовательской аватарки."""
    base_dir = user_avatar_upload_dir()
    return f"{base_dir}/{_safe_upload_filename(filename)}"


def group_avatar_upload_to(_room, filename: str) -> str:
    """Формирует путь сохранения групповой аватарки."""
    return f"{group_avatar_upload_dir()}/{_safe_upload_filename(filename)}"


def _safe_profile(user: Any):
    """Безопасно получает профиль пользователя без падений в рантайме."""
    if user is None:
        return None
    try:
        profile = getattr(user, "profile", None)
    except Exception:  # noqa: BLE001
        profile = None
    if profile is not None:
        return profile

    user_pk = getattr(user, "pk", None)
    if user_pk is None or not hasattr(user, "_meta"):
        return None

    try:
        from users.models import Profile

        return Profile.objects.filter(user_id=user_pk).first()
    except Exception:  # noqa: BLE001
        return None


def _is_http_url(value: str) -> bool:
    normalized = value.lower()
    return normalized.startswith("http://") or normalized.startswith("https://")


def _is_same_media_file(path: str, candidate: str) -> bool:
    left = _normalized_media_path(path)
    right = _normalized_media_path(candidate)
    if not left or not right:
        return False
    if left == right:
        return True
    return PurePosixPath(left).name == PurePosixPath(right).name


def _is_default_user_image(path: str) -> bool:
    defaults = (
        *_USER_DEFAULT_IMAGE_ALIASES,
        user_password_default_avatar_path(),
        user_oauth_default_avatar_path(),
    )
    return any(_is_same_media_file(path, candidate) for candidate in defaults)


def resolve_user_avatar_source(user: Any) -> str | None:
    """Возвращает источник аватара пользователя с учетом fallback-логики."""
    profile = _safe_profile(user)
    is_oauth_user = user_has_oauth_identity(user)
    fallback_avatar = (
        user_oauth_default_avatar_path()
        if is_oauth_user
        else user_password_default_avatar_path()
    )
    if profile is None:
        return fallback_avatar or None

    image = getattr(profile, "image", None)
    image_name = _trimmed(getattr(image, "name", "") if image is not None else "")
    avatar_url = _trimmed(getattr(profile, "avatar_url", ""))

    if image_name and not _is_default_user_image(image_name):
        return image_name

    if avatar_url:
        if _is_http_url(avatar_url):
            return avatar_url
        normalized_avatar_path = _normalized_media_path(avatar_url)
        if normalized_avatar_path:
            return normalized_avatar_path

    return fallback_avatar or None


def resolve_group_avatar_source(room: Any) -> str | None:
    """Возвращает источник аватара группы или дефолтную картинку."""
    if room is None:
        return group_default_avatar_path() or None

    avatar = getattr(room, "avatar", None)
    avatar_name = _trimmed(getattr(avatar, "name", "") if avatar is not None else "")
    normalized = _normalized_media_path(avatar_name)
    if normalized:
        return normalized
    return group_default_avatar_path() or None


def resolve_avatar_url_from_request(request, source: str | None) -> str | None:
    """Собирает абсолютный URL аватара из HTTP-запроса."""
    normalized = _trimmed(source)
    if not normalized:
        return None
    return build_profile_url_from_request(request, normalized)


def resolve_avatar_url_from_scope(scope, source: str | None) -> str | None:
    """Собирает абсолютный URL аватара из ASGI scope."""
    normalized = _trimmed(source)
    if not normalized:
        return None
    return build_profile_url(scope, normalized)


def resolve_user_avatar_url_from_request(request, user: Any) -> str | None:
    return resolve_avatar_url_from_request(request, resolve_user_avatar_source(user))


def resolve_user_avatar_url_from_scope(scope, user: Any) -> str | None:
    return resolve_avatar_url_from_scope(scope, resolve_user_avatar_source(user))


def resolve_group_avatar_url_from_request(request, room: Any) -> str | None:
    return resolve_avatar_url_from_request(request, resolve_group_avatar_source(room))


def resolve_group_avatar_url_from_scope(scope, room: Any) -> str | None:
    return resolve_avatar_url_from_scope(scope, resolve_group_avatar_source(room))
