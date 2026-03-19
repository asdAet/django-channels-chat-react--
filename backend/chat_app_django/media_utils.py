"""Утилиты media URL: signed-ссылки, room-scoped ссылки и crop аватарок."""

import hashlib
import hmac
import posixpath
import time
from ipaddress import ip_address
from urllib.parse import quote, unquote, urlencode, urlparse

from django.conf import settings

_DEFAULT_INTERNAL_HOSTNAMES = {
    "localhost",
    "backend",
    "backend-1",
    "app-backend",
    "app-backend-1",
    "nginx",
    "nginx-1",
    "app-nginx",
    "app-nginx-1",
    "0.0.0.0",
}

INTERNAL_HOSTNAMES: set[str] = set(
    getattr(settings, "MEDIA_INTERNAL_HOSTNAMES", _DEFAULT_INTERNAL_HOSTNAMES)
)


def serialize_avatar_crop(profile) -> dict[str, float] | None:
    """Сериализует avatar crop в формат, пригодный для передачи клиенту.
    
    Args:
        profile: Профиль пользователя, для которого вычисляется состояние.
    
    Returns:
        Словарь типа dict[str, float] | None с результатами операции.
    """
    if not profile:
        return None

    raw_x = getattr(profile, "avatar_crop_x", None)
    raw_y = getattr(profile, "avatar_crop_y", None)
    raw_width = getattr(profile, "avatar_crop_width", None)
    raw_height = getattr(profile, "avatar_crop_height", None)
    if raw_x is None or raw_y is None or raw_width is None or raw_height is None:
        return None

    try:
        x = float(raw_x)
        y = float(raw_y)
        width = float(raw_width)
        height = float(raw_height)
    except (TypeError, ValueError):
        return None

    return {
        "x": x,
        "y": y,
        "width": width,
        "height": height,
    }


def _decode_header(value: bytes | None) -> str | None:
    """Декодирует header из внешнего представления.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not value:
        return None
    try:
        return value.decode("utf-8")
    except UnicodeDecodeError:
        return value.decode("latin-1", errors="ignore")


def _get_header(scope, name: bytes) -> str | None:
    """Возвращает header из текущего контекста или хранилища.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        name: Человекочитаемое имя сущности или объекта.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    for header, value in scope.get("headers", []):
        if header == name:
            return _decode_header(value)
    return None


def _first_value(value: str | None) -> str | None:
    """Выполняет вспомогательную обработку для first value.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, полученный при выполнении операции.
    """
    if not value:
        return None
    return value.split(",")[0].strip()


def _normalize_scheme(value: str | None) -> str | None:
    """Нормализует scheme к внутреннему формату приложения.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not value:
        return None
    lowered = value.strip().lower()
    if lowered in {"http", "https"}:
        return lowered
    if lowered == "wss":
        return "https"
    if lowered == "ws":
        return "http"
    return None


def _normalize_base_url(value: str | None) -> str | None:
    """Нормализует base url к внутреннему формату приложения.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"}:
        return None
    if not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def _base_from_host_and_scheme(host: str | None, scheme: str | None) -> str | None:
    """Вспомогательная функция `_base_from_host_and_scheme` реализует внутренний шаг бизнес-логики.
    
    Args:
        host: Параметр host, используемый в логике функции.
        scheme: Параметр scheme, используемый в логике функции.
    
    Returns:
        Объект типа str | None, сформированный в ходе выполнения.
    """
    host_value = _first_value(host)
    if not host_value:
        return None
    normalized_scheme = _normalize_scheme(_first_value(scheme)) or "http"
    return f"{normalized_scheme}://{host_value}"


def normalize_media_path(image_name: str | None) -> str | None:
    """Нормализует media path к внутреннему формату приложения.
    
    Args:
        image_name: Имя файла изображения в media-хранилище.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not image_name:
        return None

    raw = image_name.strip()
    if not raw:
        return None
    # Поддерживает обычный, URL-кодированный и двойной URL-кодированный путь.
    for _ in range(2):
        decoded = unquote(raw)
        if decoded == raw:
            break
        raw = decoded

    media_url = settings.MEDIA_URL or "/media/"
    if raw.startswith(media_url):
        raw = raw[len(media_url):]

    raw = raw.lstrip("/").replace("\\", "/")
    normalized = posixpath.normpath(raw)
    if normalized in {"", ".", ".."}:
        return None
    if normalized.startswith("../"):
        return None
    return normalized


def _is_internal_host(hostname: str | None) -> bool:
    """Проверяет условие internal host и возвращает логический результат.
    
    Args:
        hostname: Имя хоста без схемы и дополнительных частей URL.
    
    Returns:
        Логическое значение результата проверки.
    """
    if not hostname:
        return False

    host = hostname.strip().lower()
    if host in INTERNAL_HOSTNAMES:
        return True

    try:
        ip = ip_address(host)
    except ValueError:
        return False

    return ip.is_private or ip.is_loopback or ip.is_link_local


def _hostname_from_base(base: str | None) -> str | None:
    """Вспомогательная функция `_hostname_from_base` реализует внутренний шаг бизнес-логики.
    
    Args:
        base: Параметр base, используемый в логике функции.
    
    Returns:
        Объект типа str | None, сформированный в ходе выполнения.
    """
    if not base:
        return None
    parsed = urlparse(base)
    return parsed.hostname


def _should_prefer_origin(candidate_base: str | None, origin_base: str | None) -> bool:
    """Определяет, нужно ли выполнять действие prefer origin.
    
    Args:
        candidate_base: Кандидат на роль базового URL для валидации и выбора.
        origin_base: Базовый URL, полученный из заголовка Origin.
    
    Returns:
        Логическое значение результата проверки.
    """
    if not candidate_base or not origin_base:
        return False

    candidate_host = _hostname_from_base(candidate_base)
    origin_host = _hostname_from_base(origin_base)
    if not candidate_host or not origin_host:
        return False

    return _is_internal_host(candidate_host) and not _is_internal_host(origin_host)


def _pick_base_url(
    configured_base: str | None,
    forwarded_base: str | None,
    host_base: str | None,
    origin_base: str | None,
) -> str | None:
    """Выбирает base url из набора кандидатов по заданным правилам.
    
    Args:
        configured_base: Базовый URL, заданный в конфигурации приложения.
        forwarded_base: Базовый URL, восстановленный из прокси-заголовков.
        host_base: Базовый URL, собранный из host и схемы запроса.
        origin_base: Базовый URL, полученный из заголовка Origin.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if configured_base:
        return configured_base

    for base in (forwarded_base, host_base):
        if not base:
            continue
        if _should_prefer_origin(base, origin_base):
            continue
        return base

    if origin_base:
        return origin_base

    return forwarded_base or host_base


def _coerce_media_source(image_name: str | None, trusted_hosts: set[str] | None = None) -> str | None:
    """Преобразует media source к допустимому типу или формату.
    
    Args:
        image_name: Имя файла изображения в media-хранилище.
        trusted_hosts: Список доверенных хостов для проверки безопасности URL.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not image_name:
        return None

    raw = image_name.strip()
    if not raw:
        return None

    if not (raw.startswith("http://") or raw.startswith("https://")):
        return raw

    parsed = urlparse(raw)
    media_candidate = normalize_media_path(parsed.path)
    hostname = (parsed.hostname or "").strip().lower()
    trusted = {host.strip().lower() for host in (trusted_hosts or set()) if host}
    if media_candidate and (_is_internal_host(hostname) or hostname in trusted):
        return media_candidate

    return raw


def _media_signing_key() -> bytes:
    """Выполняет вспомогательную обработку для media signing key.
    
    Returns:
        Объект типа bytes, полученный при выполнении операции.
    """
    key = getattr(settings, "MEDIA_SIGNING_KEY", None) or getattr(settings, "SECRET_KEY", "")
    return str(key).encode("utf-8")


def _media_signature(path: str, expires_at: int) -> str:
    """Вспомогательная функция `_media_signature` реализует внутренний шаг бизнес-логики.
    
    Args:
        path: Путь ресурса в storage или URL-маршруте.
        expires_at: Параметр expires at, используемый в логике функции.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    payload = f"{path}:{expires_at}".encode("utf-8")
    return hmac.new(_media_signing_key(), payload, hashlib.sha256).hexdigest()


def is_valid_media_signature(path: str, expires_at: int, signature: str | None) -> bool:
    """Проверяет условие valid media signature и возвращает логический результат.
    
    Args:
        path: Путь к ресурсу в storage или media-каталоге.
        expires_at: Метка времени истечения срока действия ссылки или токена.
        signature: Криптографическая подпись для валидации целостности ссылки.
    
    Returns:
        Логическое значение результата проверки.
    """
    normalized = normalize_media_path(path)
    if not normalized or not signature:
        return False
    expected = _media_signature(normalized, expires_at)
    return hmac.compare_digest(expected, str(signature))


def _signed_media_url_path(image_name: str | None, expires_at: int | None = None) -> str | None:
    """Вспомогательная функция `_signed_media_url_path` реализует внутренний шаг бизнес-логики.
    
    Args:
        image_name: Параметр image name, используемый в логике функции.
        expires_at: Параметр expires at, используемый в логике функции.
    
    Returns:
        Объект типа str | None, сформированный в ходе выполнения.
    """
    normalized = normalize_media_path(image_name)
    if not normalized:
        return None

    ttl_seconds = int(getattr(settings, "MEDIA_URL_TTL_SECONDS", 300))
    expiry = int(expires_at) if expires_at is not None else int(time.time()) + ttl_seconds
    signature = _media_signature(normalized, expiry)
    encoded_path = quote(normalized, safe="/")
    query = urlencode({"exp": expiry, "sig": signature})
    return f"/api/auth/media/{encoded_path}?{query}"


def is_chat_attachment_media_path(path: str | None) -> bool:
    """Проверяет условие chat attachment media path и возвращает логический результат.
    
    Args:
        path: Путь к ресурсу в storage или media-каталоге.
    
    Returns:
        Логическое значение результата проверки.
    """
    normalized = normalize_media_path(path)
    if not normalized:
        return False
    return normalized.startswith("chat_attachments/") or normalized.startswith("chat_thumbnails/")


def _parse_positive_room_id(room_id: int | str | None) -> int | None:
    """Разбирает positive room id из входных данных с валидацией формата.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Объект типа int | None, сформированный в рамках обработки.
    """
    if isinstance(room_id, bool):
        return None

    if isinstance(room_id, int):
        parsed = room_id
    elif isinstance(room_id, str):
        raw = room_id.strip()
        if not raw:
            return None
        try:
            parsed = int(raw)
        except ValueError:
            return None
    else:
        return None

    if parsed < 1:
        return None
    return parsed


def _room_scoped_media_url_path(image_name: str | None, room_id: int | str | None) -> str | None:
    """Вспомогательная функция `_room_scoped_media_url_path` реализует внутренний шаг бизнес-логики.
    
    Args:
        image_name: Параметр image name, используемый в логике функции.
        room_id: Идентификатор комнаты.
    
    Returns:
        Объект типа str | None, сформированный в ходе выполнения.
    """
    normalized = normalize_media_path(image_name)
    if not normalized or not is_chat_attachment_media_path(normalized):
        return None

    room = _parse_positive_room_id(room_id)
    if room is None:
        return None

    encoded_path = quote(normalized, safe="/")
    query = urlencode({"roomId": room})
    return f"/api/auth/media/{encoded_path}?{query}"


def build_room_media_url_from_request(
    request,
    image_name: str | None,
    room_id: int | str | None,
) -> str | None:
    """Формирует room media url from request для дальнейшего использования в потоке обработки.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        image_name: Имя файла изображения в media-хранилище.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    configured_base = _normalize_base_url(getattr(settings, "PUBLIC_BASE_URL", None))
    origin_base = _normalize_base_url(_first_value(request.META.get("HTTP_ORIGIN")))
    forwarded_base = _base_from_host_and_scheme(
        request.META.get("HTTP_X_FORWARDED_HOST"),
        request.META.get("HTTP_X_FORWARDED_PROTO"),
    )

    try:
        host = request.get_host()
    except Exception:
        host = ""
    host_base = None
    if host:
        scheme = "https" if request.is_secure() else "http"
        host_base = f"{scheme}://{host}"

    trusted_hosts = {
        _hostname_from_base(configured_base),
        _hostname_from_base(origin_base),
        _hostname_from_base(forwarded_base),
        _hostname_from_base(host_base),
    }
    source = _coerce_media_source(image_name, trusted_hosts={h for h in trusted_hosts if h})
    if not source:
        return None

    # Room-scoped ссылки вложений не должны перенаправляться на внешние URL.
    if source.startswith("http://") or source.startswith("https://"):
        return None

    path = _room_scoped_media_url_path(source, room_id)
    if not path:
        return None

    base = _pick_base_url(configured_base, forwarded_base, host_base, origin_base)
    if base:
        return f"{base}{path}"

    return path


def build_profile_url_from_request(request, image_name: str | None) -> str | None:
    """Формирует profile url from request для дальнейшего использования в потоке обработки.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        image_name: Имя файла изображения в media-хранилище.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    configured_base = _normalize_base_url(getattr(settings, "PUBLIC_BASE_URL", None))
    origin_base = _normalize_base_url(_first_value(request.META.get("HTTP_ORIGIN")))
    forwarded_base = _base_from_host_and_scheme(
        request.META.get("HTTP_X_FORWARDED_HOST"),
        request.META.get("HTTP_X_FORWARDED_PROTO"),
    )

    try:
        host = request.get_host()
    except Exception:
        host = ""
    host_base = None
    if host:
        scheme = "https" if request.is_secure() else "http"
        host_base = f"{scheme}://{host}"

    trusted_hosts = {
        _hostname_from_base(configured_base),
        _hostname_from_base(origin_base),
        _hostname_from_base(forwarded_base),
        _hostname_from_base(host_base),
    }
    source = _coerce_media_source(image_name, trusted_hosts={h for h in trusted_hosts if h})
    if not source:
        return None

    if source.startswith("http://") or source.startswith("https://"):
        return source

    path = _signed_media_url_path(source)
    if not path:
        return None

    base = _pick_base_url(configured_base, forwarded_base, host_base, origin_base)
    if base:
        return f"{base}{path}"

    return path


def build_profile_url(scope, image_name: str | None) -> str | None:
    """Формирует profile url для дальнейшего использования в потоке обработки.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        image_name: Имя файла изображения в media-хранилище.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    configured_base = _normalize_base_url(getattr(settings, "PUBLIC_BASE_URL", None))
    origin_base = _normalize_base_url(_first_value(_get_header(scope, b"origin")))
    forwarded_base = _base_from_host_and_scheme(
        _get_header(scope, b"x-forwarded-host"),
        _get_header(scope, b"x-forwarded-proto"),
    )
    host_base = _base_from_host_and_scheme(
        _get_header(scope, b"host"),
        "https" if scope.get("scheme") in {"wss", "https"} else "http",
    )
    trusted_hosts = {
        _hostname_from_base(configured_base),
        _hostname_from_base(origin_base),
        _hostname_from_base(forwarded_base),
        _hostname_from_base(host_base),
    }
    source = _coerce_media_source(image_name, trusted_hosts={h for h in trusted_hosts if h})
    if not source:
        return None

    if source.startswith("http://") or source.startswith("https://"):
        return source

    path = _signed_media_url_path(source)
    if not path:
        return None

    base = _pick_base_url(configured_base, forwarded_base, host_base, origin_base)
    if base:
        return f"{base}{path}"

    server = scope.get("server") or (None, None)
    host_from_server, port_from_server = server
    if host_from_server:
        host_value = str(host_from_server)
        if ":" not in host_value and port_from_server:
            host_value = f"{host_value}:{port_from_server}"
        scheme = "https" if scope.get("scheme") in {"wss", "https"} else "http"
        return f"{scheme}://{host_value}{path}"

    return path
