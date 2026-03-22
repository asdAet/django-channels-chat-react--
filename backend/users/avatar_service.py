"""Единый сервис выбора источника аватара и сборки URL."""

from __future__ import annotations

from collections.abc import Sized
from pathlib import Path, PurePosixPath
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
_DEFAULT_AVATAR_ASSET_ROOT = Path(__file__).resolve().parent / "static" / "users" / "default_avatars"
_DEFAULT_USER_PASSWORD_ASSET = _DEFAULT_AVATAR_ASSET_ROOT / "Password_defualt.jpg"
_DEFAULT_USER_OAUTH_ASSET = _DEFAULT_AVATAR_ASSET_ROOT / "OAuth_defualt.jpg"
_DEFAULT_GROUP_ASSET = _DEFAULT_AVATAR_ASSET_ROOT / "Group_defualt.jpg"
_USER_DEFAULT_IMAGE_ALIASES = (
    "default.jpg",
    "avatars/users/password/default.jpg",
    "avatars/users/oauth/default.jpg",
)


def _trimmed(value: Any) -> str:
    """Выполняет вспомогательную обработку для trimmed.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return str(value or "").strip()


def _normalized_media_path(value: str | None) -> str:
    """Выполняет вспомогательную обработку для normalized media path.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    normalized = normalize_media_path(value)
    return normalized or ""


def _setting_media_path(name: str, default: str) -> str:
    """Выполняет вспомогательную обработку для setting media path.
    
    Args:
        name: Человекочитаемое имя объекта или параметра.
        default: Значение по умолчанию при отсутствии входных данных.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    configured = _trimmed(getattr(settings, name, default))
    normalized = _normalized_media_path(configured)
    if normalized:
        return normalized
    return _normalized_media_path(default)


def _setting_media_dir(name: str, default: str) -> str:
    """Выполняет вспомогательную обработку для setting media dir.
    
    Args:
        name: Человекочитаемое имя объекта или параметра.
        default: Значение по умолчанию при отсутствии входных данных.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    value = _setting_media_path(name, default).strip("/")
    return value or default.strip("/")


def user_password_default_avatar_path() -> str:
    """Вспомогательная функция `user_password_default_avatar_path` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return _setting_media_path("USER_PASSWORD_DEFAULT_AVATAR", _DEFAULT_USER_PASSWORD_AVATAR)


def user_oauth_default_avatar_path() -> str:
    """Вспомогательная функция `user_oauth_default_avatar_path` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return _setting_media_path("USER_OAUTH_DEFAULT_AVATAR", _DEFAULT_USER_OAUTH_AVATAR)


def group_default_avatar_path() -> str:
    """Вспомогательная функция `group_default_avatar_path` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return _setting_media_path("GROUP_DEFAULT_AVATAR", _DEFAULT_GROUP_AVATAR)


def user_avatar_upload_dir() -> str:
    """Вспомогательная функция `user_avatar_upload_dir` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return _setting_media_dir("USER_AVATAR_UPLOAD_DIR", _DEFAULT_USER_UPLOAD_DIR)


def group_avatar_upload_dir() -> str:
    """Вспомогательная функция `group_avatar_upload_dir` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return _setting_media_dir("GROUP_AVATAR_UPLOAD_DIR", _DEFAULT_GROUP_UPLOAD_DIR)


def _safe_upload_filename(filename: str | None) -> str:
    """Выполняет вспомогательную обработку для safe upload filename.
    
    Args:
        filename: Имя файла, переданного в обработку.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    name = PurePosixPath(_trimmed(filename).replace("\\", "/")).name
    if not name or name in {".", ".."}:
        return "avatar"
    return name


def user_has_oauth_identity(user: Any) -> bool:
    """Проверяет наличие пользователь с учетом OAuth identity-данные.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Логическое значение результата проверки.
    """
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
    """Вспомогательная функция `profile_avatar_upload_to` реализует внутренний шаг бизнес-логики.
    
    Args:
        profile: Параметр profile, используемый в логике функции.
        filename: Параметр filename, используемый в логике функции.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    base_dir = user_avatar_upload_dir()
    return f"{base_dir}/{_safe_upload_filename(filename)}"


def group_avatar_upload_to(_room, filename: str) -> str:
    """Вспомогательная функция `group_avatar_upload_to` реализует внутренний шаг бизнес-логики.
    
    Args:
        _room: Комната, переданная в upload_to-хук.
        filename: Параметр filename, используемый в логике функции.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return f"{group_avatar_upload_dir()}/{_safe_upload_filename(filename)}"


def _safe_profile(user: Any):
    """Выполняет вспомогательную обработку для safe profile.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Проверяет условие http url и возвращает логический результат.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Логическое значение результата проверки.
    """
    normalized = value.lower()
    return normalized.startswith("http://") or normalized.startswith("https://")


def _is_same_media_file(path: str, candidate: str) -> bool:
    """Проверяет условие same media file и возвращает логический результат.
    
    Args:
        path: Путь к ресурсу в storage или media-каталоге.
        candidate: Кандидатный объект для сравнения с текущим контекстом.
    
    Returns:
        Логическое значение результата проверки.
    """
    left = _normalized_media_path(path)
    right = _normalized_media_path(candidate)
    if not left or not right:
        return False
    if left == right:
        return True
    return PurePosixPath(left).name == PurePosixPath(right).name


def _is_default_user_image(path: str) -> bool:
    """Проверяет условие default user image и возвращает логический результат.
    
    Args:
        path: Путь к ресурсу в storage или media-каталоге.
    
    Returns:
        Логическое значение результата проверки.
    """
    defaults = (
        *_USER_DEFAULT_IMAGE_ALIASES,
        user_password_default_avatar_path(),
        user_oauth_default_avatar_path(),
    )
    return any(_is_same_media_file(path, candidate) for candidate in defaults)


def resolve_bundled_default_avatar_file(path: str | None) -> Path | None:
    """Возвращает встроенный default avatar asset для известных логических avatar paths.

    Дефолтные аватары относятся к ассетам приложения, а не к пользовательским upload-файлам.
    Поэтому backend должен уметь отдать их даже если production MEDIA_ROOT пустой.
    """
    normalized = _normalized_media_path(path)
    if not normalized:
        return None

    candidates = (
        (user_password_default_avatar_path(), _DEFAULT_USER_PASSWORD_ASSET),
        (user_oauth_default_avatar_path(), _DEFAULT_USER_OAUTH_ASSET),
        (group_default_avatar_path(), _DEFAULT_GROUP_ASSET),
    )
    for configured_path, bundled_asset in candidates:
        if _is_same_media_file(normalized, configured_path) and bundled_asset.is_file():
            return bundled_asset
    return None


def resolve_user_avatar_source(user: Any) -> str | None:
    """Определяет user avatar source на основе доступного контекста.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
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
    """Определяет group avatar source на основе доступного контекста.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if room is None:
        return group_default_avatar_path() or None

    avatar = getattr(room, "avatar", None)
    avatar_name = _trimmed(getattr(avatar, "name", "") if avatar is not None else "")
    normalized = _normalized_media_path(avatar_name)
    if normalized:
        return normalized
    return group_default_avatar_path() or None


def resolve_avatar_url_from_request(request, source: str | None) -> str | None:
    """Определяет avatar url from request на основе доступного контекста.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        source: Источник данных или медиа-путь, который нужно обработать.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    normalized = _trimmed(source)
    if not normalized:
        return None
    return build_profile_url_from_request(request, normalized)


def resolve_avatar_url_from_scope(scope, source: str | None) -> str | None:
    """Определяет avatar url from scope на основе доступного контекста.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        source: Источник данных или медиа-путь, который нужно обработать.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    normalized = _trimmed(source)
    if not normalized:
        return None
    return build_profile_url(scope, normalized)


def resolve_user_avatar_url_from_request(request, user: Any) -> str | None:
    """Определяет user avatar url from request на основе доступного контекста.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    return resolve_avatar_url_from_request(request, resolve_user_avatar_source(user))


def resolve_user_avatar_url_from_scope(scope, user: Any) -> str | None:
    """Определяет user avatar url from scope на основе доступного контекста.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    return resolve_avatar_url_from_scope(scope, resolve_user_avatar_source(user))


def resolve_group_avatar_url_from_request(request, room: Any) -> str | None:
    """Определяет group avatar url from request на основе доступного контекста.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    return resolve_avatar_url_from_request(request, resolve_group_avatar_source(room))


def resolve_group_avatar_url_from_scope(scope, room: Any) -> str | None:
    """Определяет group avatar url from scope на основе доступного контекста.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    return resolve_avatar_url_from_scope(scope, resolve_group_avatar_source(room))
