"""Signals for message-related observability counters."""

from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from chat_app_django.metrics import observe_attachment_created, observe_message_created

from .models import Message, MessageAttachment


@receiver(post_save, sender=Message)
def observe_message_created_signal(sender, instance, created, **kwargs):
    if kwargs.get("raw", False) or not created:
        return

    room = getattr(instance, "room", None)
    room_kind = getattr(room, "kind", None)
    message_content = str(getattr(instance, "message_content", "") or "")
    transaction.on_commit(
        lambda room_kind=room_kind, message_content=message_content: observe_message_created(
            room_kind=room_kind,
            message_content=message_content,
        )
    )


@receiver(post_save, sender=MessageAttachment)
def observe_attachment_created_signal(sender, instance, created, **kwargs):
    if kwargs.get("raw", False) or not created:
        return

    content_type = str(getattr(instance, "content_type", "") or "")
    file_size = int(getattr(instance, "file_size", 0) or 0)
    transaction.on_commit(
        lambda content_type=content_type, file_size=file_size: observe_attachment_created(
            content_type=content_type,
            file_size=file_size,
        )
    )
