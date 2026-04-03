"""Chunked attachment upload helpers."""

from __future__ import annotations

import math
import mimetypes
import os
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from uuid import UUID, uuid4

from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone

from messages.models import Message, MessageAttachment, MessageAttachmentUpload
from messages.thumbnail import generate_thumbnail

from .services import _delete_attachment_blob

_GENERIC_CONTENT_TYPES = {
    "",
    "application/octet-stream",
    "application/x-compressed",
}
_ALIAS_CONTENT_TYPES = {
    "audio/mp3": "audio/mpeg",
    "audio/x-mp3": "audio/mpeg",
    "audio/x-mpeg": "audio/mpeg",
    "application/x-zip-compressed": "application/zip",
    "application/x-rar-compressed": "application/vnd.rar",
}
_EXTENSION_CONTENT_TYPE_OVERRIDES = {
    ".jar": "application/java-archive",
    ".zip": "application/zip",
    ".rar": "application/vnd.rar",
    ".7z": "application/x-7z-compressed",
}
_ACTIVE_UPLOAD_STATUSES = {
    MessageAttachmentUpload.Status.PENDING,
    MessageAttachmentUpload.Status.UPLOADING,
    MessageAttachmentUpload.Status.COMPLETE,
}


@dataclass(slots=True)
class AttachmentUploadError(Exception):
    """Describes a client-visible upload failure."""

    message: str
    code: str
    details: dict[str, object] | None = None
    status_code: int = 400

    def __str__(self) -> str:
        return self.message


def sanitize_attachment_filename(original_filename: str | None) -> str:
    """Normalizes a client-provided filename to a safe basename."""

    raw_name = str(original_filename or "").replace("\x00", "").strip()
    candidate = Path(raw_name).name.strip().strip(".")
    candidate = candidate[:255]
    return candidate or "file"


def canonicalize_attachment_content_type(
    content_type: str | None,
    *,
    file_name: str = "",
) -> str:
    """Normalizes declared MIME types and falls back to file extension hints."""

    normalized = str(content_type or "").strip().lower()
    aliased = _ALIAS_CONTENT_TYPES.get(normalized, normalized)

    lower_name = file_name.strip().lower()
    if lower_name.endswith((".svg", ".svgz")) and aliased in {
        "",
        "application/octet-stream",
        "text/plain",
        "text/xml",
        "application/xml",
        "image/svg",
    }:
        return "image/svg+xml"

    if aliased and aliased not in _GENERIC_CONTENT_TYPES:
        return aliased

    guessed = ""
    for extension, mapped_content_type in _EXTENSION_CONTENT_TYPE_OVERRIDES.items():
        if lower_name.endswith(extension):
            guessed = mapped_content_type
            break
    if not guessed:
        guessed, _encoding = mimetypes.guess_type(file_name)
        guessed = str(guessed or "").strip().lower()

    normalized_guess = _ALIAS_CONTENT_TYPES.get(guessed, guessed)
    if normalized_guess:
        return normalized_guess

    if aliased:
        return aliased
    return "application/octet-stream"


def enforce_attachment_content_type_policy(
    *,
    file_name: str,
    content_type: str | None,
) -> str:
    """Resolves the canonical content type and validates the allow-list policy."""

    resolved_content_type = canonicalize_attachment_content_type(
        content_type,
        file_name=file_name,
    )
    allow_any_type = bool(getattr(settings, "CHAT_ATTACHMENT_ALLOW_ANY_TYPE", True))
    if allow_any_type:
        return resolved_content_type

    allowed_types = {
        str(item).strip().lower()
        for item in getattr(settings, "CHAT_ATTACHMENT_ALLOWED_TYPES", [])
        if str(item).strip()
    }
    if allowed_types and resolved_content_type not in allowed_types:
        raise AttachmentUploadError(
            f"Тип файла '{resolved_content_type}' не поддерживается",
            code="unsupported_type",
            details={
                "fileName": file_name,
                "contentType": resolved_content_type,
                "allowedTypes": sorted(allowed_types),
            },
            status_code=400,
        )
    return resolved_content_type


def _resolve_attachment_chunk_bounds() -> tuple[int, int, int]:
    """Returns min/max chunk sizes and the target chunk count."""

    min_chunk_size = (
        int(getattr(settings, "CHAT_ATTACHMENT_CHUNK_MIN_SIZE_KB", 512)) * 1024
    )
    max_chunk_size = (
        int(getattr(settings, "CHAT_ATTACHMENT_CHUNK_MAX_SIZE_MB", 8)) * 1024 * 1024
    )
    target_chunks = int(getattr(settings, "CHAT_ATTACHMENT_TARGET_CHUNKS", 256))
    return max(1, min_chunk_size), max(1, max_chunk_size), max(1, target_chunks)


def pick_attachment_chunk_size(file_size: int) -> int:
    """Picks a bounded chunk size so large files use fewer requests without spiking RAM."""

    min_chunk_size, max_chunk_size, target_chunks = _resolve_attachment_chunk_bounds()
    bounded_max_chunk = max(min_chunk_size, max_chunk_size)
    if file_size <= 0:
        return min_chunk_size

    target_size = max(min_chunk_size, math.ceil(file_size / target_chunks))
    rounded = 1 << (target_size - 1).bit_length()
    return min(bounded_max_chunk, max(min_chunk_size, rounded))


def build_attachment_upload_expiration() -> timezone.datetime:
    """Returns the next upload-session expiration timestamp."""

    ttl_seconds = int(getattr(settings, "CHAT_ATTACHMENT_UPLOAD_TTL_SECONDS", 21600))
    return timezone.now() + timedelta(seconds=max(60, ttl_seconds))


def build_attachment_upload_storage_name(
    upload_id: UUID,
    original_filename: str,
) -> str:
    """Builds a deterministic storage path for temporary chunk uploads."""

    suffix = Path(original_filename).suffix.lower()
    if suffix:
        suffix = suffix[:20]
    now = timezone.now()
    return f"chat_upload_sessions/{now:%Y/%m}/{upload_id.hex}{suffix}.part"


def cleanup_expired_attachment_uploads(*, limit: int = 50) -> int:
    """Deletes expired upload sessions and their temporary blobs."""

    expired_uploads = list(
        MessageAttachmentUpload.objects.filter(
            status__in=_ACTIVE_UPLOAD_STATUSES,
            expires_at__lt=timezone.now(),
        ).order_by("expires_at")[: max(1, limit)]
    )
    if not expired_uploads:
        return 0

    for upload in expired_uploads:
        _delete_attachment_blob(
            default_storage,
            upload.storage_name,
            attachment_id=0,
            field_name="chunk_upload",
        )

    MessageAttachmentUpload.objects.filter(
        pk__in=[upload.pk for upload in expired_uploads]
    ).delete()
    return len(expired_uploads)


def abort_attachment_upload(upload: MessageAttachmentUpload) -> None:
    """Deletes an in-progress upload session and its temporary blob."""

    _delete_attachment_blob(
        default_storage,
        upload.storage_name,
        attachment_id=0,
        field_name="chunk_upload",
    )
    upload.delete()


def ensure_attachment_upload_not_expired(
    upload: MessageAttachmentUpload,
) -> MessageAttachmentUpload:
    """Validates upload TTL and removes expired sessions eagerly."""

    if upload.expires_at >= timezone.now():
        return upload

    _delete_attachment_blob(
        default_storage,
        upload.storage_name,
        attachment_id=0,
        field_name="chunk_upload",
    )
    upload.delete()
    raise AttachmentUploadError(
        "Сессия загрузки истекла. Начните загрузку заново.",
        code="upload_expired",
        status_code=410,
    )


def create_attachment_upload(
    *,
    room,
    user,
    original_filename: str | None,
    content_type: str | None,
    file_size: int,
) -> MessageAttachmentUpload:
    """Creates a chunked upload session backed by a temporary file on disk."""

    cleanup_expired_attachment_uploads()

    normalized_filename = sanitize_attachment_filename(original_filename)
    if file_size < 0:
        raise AttachmentUploadError(
            "Размер файла должен быть неотрицательным",
            code="invalid_file_size",
        )

    max_size = int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10)) * 1024 * 1024
    if (not getattr(user, "is_superuser", False)) and file_size > max_size:
        raise AttachmentUploadError(
            f"Файл '{normalized_filename}' превышает максимальный размер",
            code="file_too_large",
            details={
                "fileName": normalized_filename,
                "fileSize": file_size,
                "maxSize": max_size,
            },
        )

    resolved_content_type = enforce_attachment_content_type_policy(
        file_name=normalized_filename,
        content_type=content_type,
    )
    upload_id = uuid4()
    chunk_size = pick_attachment_chunk_size(file_size)
    storage_name = build_attachment_upload_storage_name(upload_id, normalized_filename)
    saved_storage_name = default_storage.save(storage_name, ContentFile(b""))

    upload = MessageAttachmentUpload(
        id=upload_id,
        room=room,
        user=user,
        original_filename=normalized_filename,
        content_type=resolved_content_type,
        file_size=file_size,
        received_bytes=0,
        storage_name=saved_storage_name,
        chunk_size=chunk_size,
        status=(
            MessageAttachmentUpload.Status.COMPLETE
            if file_size == 0
            else MessageAttachmentUpload.Status.PENDING
        ),
        expires_at=build_attachment_upload_expiration(),
    )
    try:
        upload.save()
    except Exception:
        _delete_attachment_blob(
            default_storage,
            saved_storage_name,
            attachment_id=0,
            field_name="chunk_upload",
        )
        raise
    return upload


def append_attachment_upload_chunk(
    upload: MessageAttachmentUpload,
    *,
    offset: int,
    chunk: bytes,
) -> MessageAttachmentUpload:
    """Appends a single chunk to an upload session after validating the expected offset."""

    ensure_attachment_upload_not_expired(upload)

    if upload.status == MessageAttachmentUpload.Status.COMPLETE and (
        upload.received_bytes >= upload.file_size
    ):
        raise AttachmentUploadError(
            "Загрузка уже завершена",
            code="upload_already_complete",
            details={"receivedBytes": upload.received_bytes},
            status_code=409,
        )

    if offset != upload.received_bytes:
        raise AttachmentUploadError(
            "Смещение чанка не совпадает с прогрессом сервера",
            code="offset_mismatch",
            details={
                "expectedOffset": upload.received_bytes,
                "receivedOffset": offset,
            },
            status_code=409,
        )

    remaining_bytes = upload.file_size - upload.received_bytes
    chunk_size = len(chunk)
    if chunk_size == 0:
        raise AttachmentUploadError(
            "Пустой chunk не поддерживается",
            code="empty_chunk",
        )
    if chunk_size > remaining_bytes:
        raise AttachmentUploadError(
            "Chunk превышает заявленный размер файла",
            code="chunk_too_large",
            details={
                "chunkSize": chunk_size,
                "remainingBytes": remaining_bytes,
            },
        )
    if chunk_size > upload.chunk_size:
        raise AttachmentUploadError(
            "Chunk превышает согласованный размер сессии загрузки",
            code="chunk_exceeds_session_limit",
            details={
                "chunkSize": chunk_size,
                "maxChunkSize": upload.chunk_size,
            },
            status_code=413,
        )

    with default_storage.open(upload.storage_name, "ab") as destination:
        destination.write(chunk)

    upload.received_bytes += chunk_size
    upload.status = (
        MessageAttachmentUpload.Status.COMPLETE
        if upload.received_bytes >= upload.file_size
        else MessageAttachmentUpload.Status.UPLOADING
    )
    upload.expires_at = build_attachment_upload_expiration()
    upload.save(update_fields=["received_bytes", "status", "expires_at", "updated_at"])
    return upload


def _storage_local_path(storage, storage_name: str) -> Path | None:
    """Returns a local filesystem path when the storage backend exposes one."""

    try:
        resolved = storage.path(storage_name)
    except (AttributeError, NotImplementedError, ValueError):
        return None
    return Path(resolved)


def _move_storage_blob(
    source_storage,
    source_name: str,
    target_storage,
    target_name: str,
) -> bool:
    """Moves a blob between storages when both resolve to local filesystem paths."""

    source_path = _storage_local_path(source_storage, source_name)
    target_path = _storage_local_path(target_storage, target_name)
    if source_path is None or target_path is None:
        return False

    target_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.replace(source_path, target_path)
    except OSError:
        return False
    return True


def _materialize_attachment_file(
    attachment: MessageAttachment,
    upload: MessageAttachmentUpload,
) -> bool:
    """Materializes a completed upload into the attachment file field.

    Returns True when the temporary upload blob was consumed by a local move and
    therefore must not be cleaned up separately.
    """

    file_field = attachment.file.field
    target_storage = attachment.file.storage
    target_name = str(
        file_field.generate_filename(attachment, upload.original_filename)
    ).replace("\\", "/")
    target_name = target_storage.get_available_name(
        target_name,
        max_length=file_field.max_length,
    )
    target_name = str(target_name).replace("\\", "/")

    if _move_storage_blob(
        default_storage,
        upload.storage_name,
        target_storage,
        target_name,
    ):
        attachment.file.name = target_name
        attachment.file._committed = True
        return True

    with default_storage.open(upload.storage_name, "rb") as source_file:
        attachment.file.save(
            upload.original_filename,
            File(source_file),
            save=False,
        )
    return False


def finalize_attachment_uploads(
    *,
    room,
    user,
    upload_ids: list[UUID],
    message_content: str,
    reply_to_id: int | None,
    message_username: str,
    profile_pic: str,
) -> tuple[Message, list[MessageAttachment]]:
    """Creates a chat message and materializes completed upload sessions as attachments."""

    if not upload_ids:
        raise AttachmentUploadError(
            "Файлы не переданы",
            code="no_uploads",
        )

    if len(upload_ids) != len({str(upload_id) for upload_id in upload_ids}):
        raise AttachmentUploadError(
            "Один и тот же upload нельзя использовать дважды",
            code="duplicate_upload_ids",
        )

    max_per_msg = int(getattr(settings, "CHAT_ATTACHMENT_MAX_PER_MESSAGE", 10))
    if (not getattr(user, "is_superuser", False)) and len(upload_ids) > max_per_msg:
        raise AttachmentUploadError(
            f"Максимум {max_per_msg} файлов на сообщение",
            code="too_many_files",
            details={"maxPerMessage": max_per_msg, "received": len(upload_ids)},
        )

    ordered_ids = [str(upload_id) for upload_id in upload_ids]
    created_files: list[tuple] = []
    moved_uploads: list[tuple[MessageAttachmentUpload, object, str]] = []
    temp_storage_names: list[str] = []

    with transaction.atomic():
        uploads = list(
            MessageAttachmentUpload.objects.select_for_update()
            .filter(pk__in=upload_ids, room=room)
            .order_by("created_at")
        )
        uploads_by_id = {str(upload.pk): upload for upload in uploads}
        missing_upload_ids = [upload_id for upload_id in ordered_ids if upload_id not in uploads_by_id]
        if missing_upload_ids:
            raise AttachmentUploadError(
                "Одна или несколько upload-сессий не найдены",
                code="upload_not_found",
                details={"uploadIds": missing_upload_ids},
                status_code=404,
            )

        ordered_uploads = [uploads_by_id[upload_id] for upload_id in ordered_ids]
        for upload in ordered_uploads:
            ensure_attachment_upload_not_expired(upload)
            if upload.user_id != user.pk and not getattr(user, "is_superuser", False):
                raise AttachmentUploadError(
                    "Чужая upload-сессия недоступна",
                    code="upload_forbidden",
                    status_code=403,
                )
            if upload.status != MessageAttachmentUpload.Status.COMPLETE:
                raise AttachmentUploadError(
                    f"Файл '{upload.original_filename}' ещё не загружен полностью",
                    code="upload_incomplete",
                    details={
                        "uploadId": str(upload.pk),
                        "receivedBytes": upload.received_bytes,
                        "fileSize": upload.file_size,
                    },
                    status_code=409,
                )
            if upload.received_bytes != upload.file_size:
                raise AttachmentUploadError(
                    f"Файл '{upload.original_filename}' загружен не полностью",
                    code="upload_size_mismatch",
                    details={
                        "uploadId": str(upload.pk),
                        "receivedBytes": upload.received_bytes,
                        "fileSize": upload.file_size,
                    },
                    status_code=409,
                )

        message_kwargs = {
            "message_content": message_content,
            "username": message_username,
            "user": user,
            "profile_pic": profile_pic,
            "room": room,
        }
        if reply_to_id:
            message_kwargs["reply_to_id"] = reply_to_id
        message = Message.objects.create(**message_kwargs)

        attachments: list[MessageAttachment] = []
        try:
            for upload in ordered_uploads:
                attachment = MessageAttachment(
                    message=message,
                    original_filename=upload.original_filename,
                    content_type=upload.content_type,
                    file_size=upload.file_size,
                )
                upload_blob_consumed = _materialize_attachment_file(attachment, upload)
                if upload_blob_consumed:
                    moved_uploads.append(
                        (
                            upload,
                            attachment.file.storage,
                            attachment.file.name,
                        )
                    )
                else:
                    created_files.append(
                        (
                            attachment.file.storage,
                            attachment.file.name,
                            0,
                            "file",
                        )
                    )
                attachment.save()

                if attachment.content_type.startswith("image/"):
                    thumb_info = generate_thumbnail(attachment.file)
                    if thumb_info and thumb_info.get("path") is not None:
                        attachment.thumbnail = thumb_info["path"]
                        attachment.width = thumb_info.get("width")
                        attachment.height = thumb_info.get("height")
                        attachment.save(update_fields=["thumbnail", "width", "height"])
                        created_files.append(
                            (
                                attachment.thumbnail.storage,
                                attachment.thumbnail.name,
                                attachment.pk,
                                "thumbnail",
                            )
                        )
                    elif thumb_info:
                        attachment.width = thumb_info.get("width")
                        attachment.height = thumb_info.get("height")
                        attachment.save(update_fields=["width", "height"])

                attachments.append(attachment)
                if not upload_blob_consumed:
                    temp_storage_names.append(upload.storage_name)
        except Exception:
            for upload, storage, blob_name in reversed(moved_uploads):
                if _move_storage_blob(
                    storage,
                    blob_name,
                    default_storage,
                    upload.storage_name,
                ):
                    continue
                _delete_attachment_blob(
                    storage,
                    blob_name,
                    attachment_id=0,
                    field_name="file",
                )
            for storage, blob_name, attachment_id, field_name in created_files:
                _delete_attachment_blob(
                    storage,
                    blob_name,
                    attachment_id=attachment_id,
                    field_name=field_name,
                )
            raise

        upload_pk_list = [upload.pk for upload in ordered_uploads]

        def _cleanup_materialized_uploads() -> None:
            for storage_name in temp_storage_names:
                _delete_attachment_blob(
                    default_storage,
                    storage_name,
                    attachment_id=0,
                    field_name="chunk_upload",
                )
            MessageAttachmentUpload.objects.filter(pk__in=upload_pk_list).delete()

        transaction.on_commit(_cleanup_materialized_uploads)
        return message, attachments
