"""Утилиты для нормализации одноразовых visitor-событий сайта."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final
from urllib.parse import urlparse


VISITOR_ID_PATTERN: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{7,127}$")
PRIMARY_POINTER_VALUES: Final[set[str]] = {"coarse", "fine", "none"}
BOT_MARKERS: Final[tuple[str, ...]] = (
    "bot",
    "crawler",
    "spider",
    "slurp",
    "curl",
    "wget",
    "python-requests",
    "headless",
    "uptimerobot",
    "blackbox-exporter",
    "grafana",
)
BROWSER_PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = (
    ("Yandex Browser", re.compile(r"YaBrowser/([\d.]+)", re.IGNORECASE)),
    ("Samsung Internet", re.compile(r"SamsungBrowser/([\d.]+)", re.IGNORECASE)),
    ("Edge", re.compile(r"EdgA?/([\d.]+)", re.IGNORECASE)),
    ("Opera", re.compile(r"OPR/([\d.]+)", re.IGNORECASE)),
    ("Chrome", re.compile(r"(?:Chrome|CriOS)/([\d.]+)", re.IGNORECASE)),
    ("Firefox", re.compile(r"(?:Firefox|FxiOS)/([\d.]+)", re.IGNORECASE)),
    ("Safari", re.compile(r"Version/([\d.]+).+Safari", re.IGNORECASE)),
)
OS_PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = (
    ("Windows", re.compile(r"Windows NT ([\d.]+)", re.IGNORECASE)),
    ("Android", re.compile(r"Android ([\d.]+)", re.IGNORECASE)),
    ("iOS", re.compile(r"iPhone OS ([\d_]+)", re.IGNORECASE)),
    ("iPadOS", re.compile(r"CPU OS ([\d_]+)", re.IGNORECASE)),
    ("macOS", re.compile(r"Mac OS X ([\d_]+)", re.IGNORECASE)),
    ("Linux", re.compile(r"Linux", re.IGNORECASE)),
)


@dataclass(frozen=True)
class DeviceSnapshot:
    """Снимок устройства, который фронтенд отправляет вместе с visitor-событием."""

    viewport_width: int
    viewport_height: int
    is_mobile_viewport: bool
    has_touch: bool
    is_touch_desktop: bool
    can_hover: bool
    primary_pointer: str
    platform: str | None
    language: str | None
    time_zone: str | None


@dataclass(frozen=True)
class DeviceDescriptor:
    """Нормализованное описание устройства для Grafana и audit-логов."""

    device_class: str
    device_vendor: str | None
    device_model: str | None
    device_label: str
    device_summary: str
    browser_family: str
    browser_version: str | None
    os_family: str
    os_version: str | None


def _clean_text(value: object, *, max_length: int) -> str | None:
    """Очищает строковое поле payload и ограничивает его длину."""

    if not isinstance(value, str):
        return None
    normalized = " ".join(value.split()).strip()
    if not normalized:
        return None
    return normalized[:max_length]


def _clean_path(value: object, *, max_length: int) -> str | None:
    """Нормализует путь страницы и гарантирует ведущий слеш."""

    normalized = _clean_text(value, max_length=max_length)
    if not normalized:
        return None
    if normalized.startswith("/"):
        return normalized
    return f"/{normalized}"


def _clean_bool(value: object, *, default: bool = False) -> bool:
    """Преобразует входное значение в булев флаг."""

    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return default


def _clean_int(value: object, *, default: int = 0, maximum: int = 20_000) -> int:
    """Преобразует входное значение в целое число в допустимом диапазоне."""

    if isinstance(value, bool):
        return default
    if not isinstance(value, (int, float, str)):
        return default
    try:
        normalized = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, min(normalized, maximum))


def _clean_pointer(value: object) -> str:
    """Возвращает допустимое значение primary pointer."""

    normalized = _clean_text(value, max_length=16)
    if normalized in PRIMARY_POINTER_VALUES:
        return normalized
    return "none"


def _extract_referrer_host(referrer: str | None) -> str | None:
    """Извлекает host из referrer для компактной сводки в Grafana."""

    if not referrer:
        return None
    try:
        parsed = urlparse(referrer)
    except ValueError:
        return None
    host = (parsed.netloc or "").strip()
    return host[:255] if host else None


def _parse_browser(user_agent: str) -> tuple[str, str | None]:
    """Возвращает семейство и версию браузера из User-Agent."""

    for family, pattern in BROWSER_PATTERNS:
        match = pattern.search(user_agent)
        if match:
            return family, match.group(1)
    return "Unknown", None


def _parse_os(user_agent: str, platform: str | None) -> tuple[str, str | None]:
    """Возвращает ОС и ее версию из User-Agent и platform."""

    for family, pattern in OS_PATTERNS:
        match = pattern.search(user_agent)
        if match:
            version = match.group(1) if match.groups() else None
            if version:
                version = version.replace("_", ".")
            return family, version

    normalized_platform = (platform or "").lower()
    if "win" in normalized_platform:
        return "Windows", None
    if "mac" in normalized_platform:
        return "macOS", None
    if "linux" in normalized_platform:
        return "Linux", None
    if "iphone" in normalized_platform or "ipad" in normalized_platform:
        return "iOS", None
    if "android" in normalized_platform:
        return "Android", None
    return "Unknown", None


def _parse_android_model(user_agent: str) -> str | None:
    """Пытается извлечь модель Android-устройства из User-Agent."""

    match = re.search(r"\(([^)]*Android[^)]*)\)", user_agent, re.IGNORECASE)
    if not match:
        return None

    for raw_part in match.group(1).split(";"):
        part = raw_part.strip()
        if not part:
            continue
        lowered = part.lower()
        if lowered in {"linux", "u", "wv", "mobile", "tablet"}:
            continue
        if lowered.startswith("android "):
            continue
        if "build/" in lowered:
            part = part.split("Build/", 1)[0].strip()
            lowered = part.lower()
        if not part or lowered in {"linux", "u", "wv", "mobile", "tablet"}:
            continue
        return part[:120]
    return None


def _guess_vendor(device_model: str | None, os_family: str) -> str | None:
    """Подбирает производителя по модели устройства."""

    if not device_model:
        if os_family in {"iOS", "iPadOS"}:
            return "Apple"
        return None

    lowered = device_model.lower()
    if "iphone" in lowered or "ipad" in lowered or "mac" in lowered:
        return "Apple"
    if lowered.startswith("sm-") or "galaxy" in lowered:
        return "Samsung"
    if "pixel" in lowered:
        return "Google"
    if "redmi" in lowered or "poco" in lowered or lowered.startswith(("mi ", "m2", "m1")):
        return "Xiaomi"
    if "oneplus" in lowered:
        return "OnePlus"
    if "huawei" in lowered or "honor" in lowered:
        return "Huawei"
    return None


def _is_bot(user_agent: str) -> bool:
    """Определяет, похож ли User-Agent на бота или мониторинг."""

    lowered = user_agent.lower()
    return any(marker in lowered for marker in BOT_MARKERS)


def _resolve_device_class(user_agent: str, snapshot: DeviceSnapshot) -> str:
    """Классифицирует устройство как desktop/mobile/tablet/bot/other."""

    lowered = user_agent.lower()
    if _is_bot(user_agent):
        return "bot"
    if "ipad" in lowered or "tablet" in lowered:
        return "tablet"
    if "android" in lowered and "mobile" not in lowered:
        return "tablet"
    if "iphone" in lowered or "mobile" in lowered:
        return "mobile"
    if snapshot.is_mobile_viewport and snapshot.has_touch:
        return "mobile"
    if snapshot.has_touch and not snapshot.can_hover and not snapshot.is_touch_desktop:
        return "tablet"
    if snapshot.is_touch_desktop:
        return "other"
    if snapshot.has_touch and snapshot.is_mobile_viewport:
        return "mobile"
    return "desktop"


def describe_device(user_agent: str | None, snapshot: DeviceSnapshot) -> DeviceDescriptor:
    """Нормализует устройство в вид, пригодный для visitor-дашборда."""

    normalized_ua = _clean_text(user_agent, max_length=512) or ""
    browser_family, browser_version = _parse_browser(normalized_ua)
    os_family, os_version = _parse_os(normalized_ua, snapshot.platform)
    device_class = _resolve_device_class(normalized_ua, snapshot)

    if device_class == "bot":
        device_model = browser_family if browser_family != "Unknown" else "Bot"
        device_vendor = None
    elif "iphone" in normalized_ua.lower():
        device_model = "iPhone"
        device_vendor = "Apple"
    elif "ipad" in normalized_ua.lower():
        device_model = "iPad"
        device_vendor = "Apple"
    elif os_family == "Android":
        device_model = _parse_android_model(normalized_ua) or "Android device"
        device_vendor = _guess_vendor(device_model, os_family)
    elif device_class == "desktop":
        device_model = snapshot.platform or os_family
        device_vendor = None
    elif device_class == "other":
        device_model = snapshot.platform or "Touch device"
        device_vendor = None
    else:
        device_model = snapshot.platform or os_family
        device_vendor = _guess_vendor(device_model, os_family)

    device_label = device_model or os_family or browser_family or "Unknown device"
    summary_parts = [device_class, device_label]
    if browser_family != "Unknown":
        summary_parts.append(browser_family)
    if os_family != "Unknown":
        summary_parts.append(os_family)

    return DeviceDescriptor(
        device_class=device_class,
        device_vendor=device_vendor,
        device_model=device_model,
        device_label=device_label[:120],
        device_summary=" | ".join(part for part in summary_parts if part)[:255],
        browser_family=browser_family,
        browser_version=(browser_version[:32] if browser_version else None),
        os_family=os_family,
        os_version=(os_version[:32] if os_version else None),
    )


def normalize_visit_payload(payload: object, *, user_agent: str | None) -> dict[str, object] | None:
    """Преобразует visitor-payload в безопасный структурированный набор полей."""

    if not isinstance(payload, dict):
        return None

    visitor_id = _clean_text(payload.get("visitorId"), max_length=128)
    if not visitor_id or not VISITOR_ID_PATTERN.fullmatch(visitor_id):
        return None

    page_path = _clean_path(payload.get("pagePath"), max_length=512)
    if not page_path:
        return None

    snapshot = DeviceSnapshot(
        viewport_width=_clean_int(payload.get("viewportWidth")),
        viewport_height=_clean_int(payload.get("viewportHeight")),
        is_mobile_viewport=_clean_bool(payload.get("isMobileViewport")),
        has_touch=_clean_bool(payload.get("hasTouch")),
        is_touch_desktop=_clean_bool(payload.get("isTouchDesktop")),
        can_hover=_clean_bool(payload.get("canHover")),
        primary_pointer=_clean_pointer(payload.get("primaryPointer")),
        platform=_clean_text(payload.get("platform"), max_length=120),
        language=_clean_text(payload.get("language"), max_length=32),
        time_zone=_clean_text(payload.get("timeZone"), max_length=64),
    )
    device = describe_device(user_agent, snapshot)
    referrer = _clean_text(payload.get("referrer"), max_length=2048)

    return {
        "visitor_id": visitor_id,
        "visitor_alias": visitor_id[-8:],
        "page_path": page_path,
        "page_title": _clean_text(payload.get("pageTitle"), max_length=200),
        "referrer": referrer,
        "referrer_host": _extract_referrer_host(referrer),
        "device_class": device.device_class,
        "device_vendor": device.device_vendor,
        "device_model": device.device_model,
        "device_label": device.device_label,
        "device_summary": device.device_summary,
        "browser_family": device.browser_family,
        "browser_version": device.browser_version,
        "os_family": device.os_family,
        "os_version": device.os_version,
        "platform": snapshot.platform,
        "language": snapshot.language,
        "time_zone": snapshot.time_zone,
        "viewport_width": snapshot.viewport_width,
        "viewport_height": snapshot.viewport_height,
        "is_mobile_viewport": snapshot.is_mobile_viewport,
        "has_touch": snapshot.has_touch,
        "is_touch_desktop": snapshot.is_touch_desktop,
        "can_hover": snapshot.can_hover,
        "primary_pointer": snapshot.primary_pointer,
        "user_agent": _clean_text(user_agent, max_length=512),
        "telemetry_source": "site_visit",
        "telemetry_version": 1,
    }
