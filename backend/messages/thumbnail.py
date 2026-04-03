"""Thumbnail generation for chat image attachments."""

from __future__ import annotations

import io
import logging
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


def _resolve_source_size(source_field) -> int | None:
    """Возвращает размер исходного файла, если его можно получить без чтения."""
    for candidate in (
        getattr(source_field, "size", None),
        getattr(getattr(source_field, "file", None), "size", None),
    ):
        if isinstance(candidate, int) and candidate >= 0:
            return candidate
    return None


def generate_thumbnail(source_field) -> dict | None:
    """Генерирует thumbnail по заданным правилам.
    
    Args:
        source_field: Параметр source field, используемый в логике функции.
    
    Returns:
        Словарь типа dict | None с данными результата.
    """
    try:
        from PIL import Image
    except ImportError:
        logger.warning("Pillow not installed — skipping thumbnail generation")
        return None

    max_side = int(getattr(settings, "CHAT_THUMBNAIL_MAX_SIDE", 400))
    max_source_size_bytes = (
        int(getattr(settings, "CHAT_THUMBNAIL_MAX_SOURCE_SIZE_MB", 25)) * 1024 * 1024
    )
    max_source_pixels = int(
        getattr(settings, "CHAT_THUMBNAIL_MAX_SOURCE_PIXELS", 50_000_000)
    )
    source_size = _resolve_source_size(source_field)
    if source_size is not None and source_size > max_source_size_bytes:
        logger.info(
            "Skipping thumbnail generation for %s: source size %s exceeds %s bytes",
            getattr(source_field, "name", "file"),
            source_size,
            max_source_size_bytes,
        )
        return None

    try:
        source_field.seek(0)
        img = Image.open(source_field)
        img.verify()
        source_field.seek(0)
        img = Image.open(source_field)
    except Exception:
        logger.debug("Не удалось открыть изображение для миниатюры", exc_info=True)
        return None

    original_width, original_height = img.size
    total_pixels = original_width * original_height
    if total_pixels > max_source_pixels:
        logger.info(
            "Skipping thumbnail generation for %s: %s pixels exceeds %s",
            getattr(source_field, "name", "file"),
            total_pixels,
            max_source_pixels,
        )
        return None

    if original_width <= max_side and original_height <= max_side:
        return {
            "path": None,
            "width": original_width,
            "height": original_height,
        }

    ratio = min(max_side / original_width, max_side / original_height)
    new_size = (int(original_width * ratio), int(original_height * ratio))

    try:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
            fmt = "PNG"
            ext = "png"
        else:
            img = img.convert("RGB")
            fmt = "JPEG"
            ext = "jpg"

        resampling = getattr(Image, "Resampling", None)
        if resampling is not None:
            resize_filter = getattr(resampling, "LANCZOS", 1)
        else:
            resize_filter = getattr(Image, "LANCZOS", 1)

        img = img.resize(new_size, resize_filter)
        buf = io.BytesIO()
        img.save(buf, format=fmt, quality=85)
        buf.seek(0)

        stem = Path(source_field.name).stem if source_field.name else "thumb"
        filename = f"thumb_{stem}.{ext}"

        return {
            "path": ContentFile(buf.read(), name=filename),
            "width": new_size[0],
            "height": new_size[1],
        }
    except Exception:
        logger.debug("Не удалось сгенерировать миниатюру", exc_info=True)
        return None
