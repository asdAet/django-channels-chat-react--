# pyright: reportIncompatibleVariableOverride=false, reportCallIssue=false
from typing import Optional

from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid

from rooms.models import Room


class Message(models.Model):
    """Модель Message описывает структуру и поведение данных в приложении."""
    username = models.CharField(max_length=50, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="chat_messages",
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    message_content = models.TextField()
    date_added = models.DateTimeField(default=timezone.now, db_index=True)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)

    # ── Edit / Delete ──────────────────────────────────────────────────
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_messages",
    )
    original_content = models.TextField(blank=True, default="")

    # ── Reply ──────────────────────────────────────────────────────────
    reply_to = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replies",
    )
    user_id: Optional[int]
    room_id: int
    deleted_by_id: Optional[int]
    reply_to_id: Optional[int]

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "chat_message"
        ordering = ("date_added",)
        indexes = [
            models.Index(fields=["room", "date_added"], name="msg_room_date_idx"),
            models.Index(fields=["username", "date_added"], name="msg_user_date_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        name = self.user.username if self.user else self.username
        return f"{name}: {self.message_content}"


class Reaction(models.Model):
    """Модель Reaction описывает структуру и поведение данных в приложении."""
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)
    message_id: int
    user_id: int

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "messages_reaction"
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user", "emoji"],
                name="reaction_msg_user_emoji_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["message"], name="reaction_message_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        return f"{self.user_id}:{self.emoji}:msg{self.message_id}"


class MessageAttachment(models.Model):
    """Модель MessageAttachment описывает структуру и поведение данных в приложении."""
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="chat_attachments/%Y/%m/")
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveBigIntegerField()
    thumbnail = models.ImageField(
        upload_to="chat_thumbnails/%Y/%m/",
        null=True,
        blank=True,
    )
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    message_id: int

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "messages_attachment"
        ordering = ["uploaded_at"]
        indexes = [
            models.Index(fields=["message"], name="attachment_message_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        return f"{self.message_id}:{self.original_filename}"


class MessageAttachmentUpload(models.Model):
    """Tracks an in-progress chunked attachment upload before message creation."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UPLOADING = "uploading", "Uploading"
        COMPLETE = "complete", "Complete"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="attachment_uploads",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_attachment_uploads",
    )
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveBigIntegerField()
    received_bytes = models.PositiveBigIntegerField(default=0)
    storage_name = models.CharField(max_length=500, unique=True)
    chunk_size = models.PositiveIntegerField()
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    room_id: int
    user_id: int

    class Meta:
        db_table = "messages_attachment_upload"
        indexes = [
            models.Index(fields=["user", "room", "status"], name="att_upl_user_room_st_idx"),
            models.Index(fields=["expires_at"], name="attachment_upload_exp_idx"),
        ]

    def __str__(self):
        return f"{self.user_id}:{self.room_id}:{self.original_filename}"


class MessageReadState(models.Model):
    """Модель MessageReadState описывает структуру и поведение данных в приложении."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="read_states",
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="read_states",
    )
    last_read_message = models.ForeignKey(
        Message,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    last_read_at = models.DateTimeField(auto_now=True)
    user_id: int
    room_id: int
    last_read_message_id: Optional[int]

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "messages_read_state"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "room"],
                name="read_state_user_room_uniq",
            ),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        return f"{self.user_id}:room{self.room_id}:msg{self.last_read_message_id}"


class MessageReadReceipt(models.Model):
    """Фиксирует точное время прочтения конкретного сообщения пользователем."""

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="read_receipts",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_read_receipts",
    )
    read_at = models.DateTimeField(default=timezone.now, db_index=True)
    message_id: int
    user_id: int

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""

        db_table = "messages_read_receipt"
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user"],
                name="read_receipt_message_user_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["message", "read_at"],
                name="read_receipt_msg_read_idx",
            ),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.

        Returns:
            Функция не возвращает значение.
        """
        return f"{self.user_id}:message{self.message_id}@{self.read_at.isoformat()}"
