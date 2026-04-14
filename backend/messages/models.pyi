from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from django.db import models
from django.db.models.fields.files import FieldFile

from rooms.models import Room


class Message(models.Model):
    username: str
    user: Any | None
    room: Room
    message_content: str
    date_added: datetime
    profile_pic: str | None
    edited_at: datetime | None
    is_deleted: bool
    deleted_at: datetime | None
    deleted_by: Any | None
    original_content: str
    reply_to: Message | None
    user_id: Optional[int]
    room_id: int
    deleted_by_id: Optional[int]
    reply_to_id: Optional[int]
    def __str__(self) -> str: ...


class Reaction(models.Model):
    message: Message
    user: Any
    emoji: str
    created_at: datetime
    message_id: int
    user_id: int
    def __str__(self) -> str: ...


class MessageAttachment(models.Model):
    message: Message
    file: FieldFile
    original_filename: str
    content_type: str
    file_size: int
    thumbnail: FieldFile
    width: int | None
    height: int | None
    uploaded_at: datetime
    message_id: int
    def __str__(self) -> str: ...


class MessageAttachmentUpload(models.Model):
    class Status(models.TextChoices):
        PENDING: str
        UPLOADING: str
        COMPLETE: str

    id: UUID
    room: Room
    user: Any
    original_filename: str
    content_type: str
    file_size: int
    received_bytes: int
    storage_name: str
    chunk_size: int
    status: str
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    room_id: int
    user_id: int
    def __str__(self) -> str: ...


class MessageReadState(models.Model):
    user: Any
    room: Room
    last_read_message: Message | None
    last_read_at: datetime
    user_id: int
    room_id: int
    last_read_message_id: Optional[int]
    def __str__(self) -> str: ...


class MessageReadReceipt(models.Model):
    message: Message
    user: Any
    read_at: datetime
    message_id: int
    user_id: int
    def __str__(self) -> str: ...
