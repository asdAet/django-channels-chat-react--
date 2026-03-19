"""Сервис проверок доступа к защищенным media-файлам."""

from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from typing import Any

from django.core.files.storage import default_storage
from django.db.models import Q

from messages.models import MessageAttachment
from roles.access import can_read
from rooms.models import Room


_GENERIC_MEDIA_CONTENT_TYPES = {
    "application/octet-stream",
    "application/xml",
    "text/plain",
    "text/xml",
}


class MediaAccessNotFoundError(Exception):
    """Класс MediaAccessNotFoundError инкапсулирует связанную бизнес-логику модуля."""


@dataclass(frozen=True)
class AttachmentMediaAccessResult:
    """Класс AttachmentMediaAccessResult инкапсулирует связанную бизнес-логику модуля."""

    room_id: int
    preferred_content_type: str | None


def _parse_positive_room_id(value: int | str | None) -> int | None:
    """Разбирает positive room id из входных данных с валидацией формата.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа int | None, сформированный в рамках обработки.
    """
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        room_id = value
    elif isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            room_id = int(raw)
        except ValueError:
            return None
    else:
        return None
    if room_id < 1:
        return None
    return room_id


def resolve_media_content_type(
    normalized_path: str,
    *,
    preferred_content_type: str | None = None,
) -> str:
    """Определяет media content type на основе доступного контекста.
    
    Args:
        normalized_path: Нормализованный путь к файлу или media-объекту.
        preferred_content_type: Предпочтительный MIME-тип ответа.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    normalized_preferred = (preferred_content_type or "").strip().lower()
    guessed_content_type = (mimetypes.guess_type(normalized_path)[0] or "").strip().lower()
    if normalized_preferred and normalized_preferred not in _GENERIC_MEDIA_CONTENT_TYPES:
        return normalized_preferred
    if guessed_content_type:
        return guessed_content_type
    if normalized_preferred:
        return normalized_preferred
    return "application/octet-stream"


def resolve_attachment_media_access(
    *,
    normalized_path: str,
    room_id_raw: int | str | None,
    user: Any,
) -> AttachmentMediaAccessResult:
    """Определяет attachment media access на основе доступного контекста.
    
    Args:
        normalized_path: Нормализованный путь к файлу или media-объекту.
        room_id_raw: Сырой идентификатор комнаты из query-параметров.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа AttachmentMediaAccessResult, сформированный в рамках обработки.
    """
    room_id = _parse_positive_room_id(room_id_raw)
    if room_id is None:
        raise MediaAccessNotFoundError

    if not user or not getattr(user, "is_authenticated", False):
        raise MediaAccessNotFoundError

    room = Room.objects.filter(pk=room_id).first()
    if room is None:
        raise MediaAccessNotFoundError

    if not can_read(room, user):
        raise MediaAccessNotFoundError

    attachment = (
        MessageAttachment.objects.filter(
            message__room_id=room_id,
            message__is_deleted=False,
        )
        .filter(Q(file=normalized_path) | Q(thumbnail=normalized_path))
        .only("content_type", "file", "thumbnail")
        .first()
    )
    if attachment is None:
        raise MediaAccessNotFoundError

    if not default_storage.exists(normalized_path):
        raise MediaAccessNotFoundError

    preferred_content_type: str | None = None
    file_name = str(getattr(attachment.file, "name", "") or "")
    thumbnail_name = str(getattr(attachment.thumbnail, "name", "") or "")
    if file_name == normalized_path:
        preferred_content_type = str(getattr(attachment, "content_type", "") or "")
    elif thumbnail_name == normalized_path:
        preferred_content_type = mimetypes.guess_type(normalized_path)[0]

    return AttachmentMediaAccessResult(
        room_id=room_id,
        preferred_content_type=preferred_content_type,
    )
