"""Business logic for message operations: edit, delete, reactions, read state."""

from __future__ import annotations

import logging
import time

from django.conf import settings
from django.db import OperationalError, ProgrammingError, transaction
from django.utils import timezone

from messages.models import (
    Message,
    MessageAttachment,
    MessageReadReceipt,
    MessageReadState,
    Reaction,
)
from roles.access import has_permission
from roles.permissions import Perm
from rooms.models import Room

logger = logging.getLogger(__name__)


def _is_missing_read_receipt_table_error(exc: Exception) -> bool:
    """Определяет, что exact read receipts недоступны из-за непримененной миграции."""

    message = str(exc).lower()
    if "messages_read_receipt" not in message:
        return False
    return (
        "no such table" in message
        or "does not exist" in message
        or "undefined table" in message
    )


def _attachment_delete_retry_delay(attempt: int) -> float:
    """Удаляет вложение с учетом повтор delay.
    
    Args:
        attempt: Параметр attempt, используемый в логике функции.
    
    Returns:
        Объект типа float, сформированный в ходе выполнения.
    """
    base_delay = float(getattr(settings, "CHAT_ATTACHMENT_DELETE_RETRY_BASE_SECONDS", 0.1))
    return max(0.0, base_delay * (attempt + 1))


# ── Exceptions ─────────────────────────────────────────────────────────

class MessageError(Exception):
    """Класс MessageError инкапсулирует связанную бизнес-логику модуля."""
    pass


class MessageNotFoundError(MessageError):
    """Класс MessageNotFoundError инкапсулирует связанную бизнес-логику модуля."""
    pass


class MessageForbiddenError(MessageError):
    """Класс MessageForbiddenError инкапсулирует связанную бизнес-логику модуля."""
    pass


class MessageValidationError(MessageError):
    """Класс MessageValidationError инкапсулирует связанную бизнес-логику модуля."""
    pass


# ── Edit / Delete ──────────────────────────────────────────────────────

def _load_message_or_raise(room: Room, message_id: int) -> Message:
    """Загружает message or raise из хранилища с необходимыми проверками.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        message_id: Идентификатор message, используемый для выборки данных.
    
    Returns:
        Объект типа Message, сформированный в рамках обработки.
    """
    msg = (
        Message.objects
        .select_for_update()
        .filter(pk=message_id, room=room, is_deleted=False)
        .first()
    )
    if not msg:
        raise MessageNotFoundError("Сообщение не найдено")
    return msg


def _can_manage_message(room: Room, user, message: Message) -> bool:
    """Проверяет условие manage message и возвращает логический результат.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
        message: Экземпляр сообщения для обработки.
    
    Returns:
        Логическое значение результата проверки.
    """
    if message.user_id == user.pk:
        return True
    return has_permission(room, user, Perm.MANAGE_MESSAGES)


def _within_edit_window(message: Message) -> bool:
    """Выполняет вспомогательную обработку для within edit window.
    
    Args:
        message: Сообщение, участвующее в обработке.
    
    Returns:
        Логическое значение результата проверки.
    """
    window = int(getattr(settings, "CHAT_MESSAGE_EDIT_WINDOW_SECONDS", 900))
    if window == 0:
        return True
    elapsed = (timezone.now() - message.date_added).total_seconds()
    return elapsed <= window


def _delete_attachment_blob(
    storage,
    blob_name: str | None,
    *,
    attachment_id: int,
    field_name: str,
) -> None:
    """Удаляет attachment blob и выполняет сопутствующие действия.
    
    Args:
        storage: Объект файлового storage для чтения и удаления blob-файлов.
        blob_name: Имя объекта в storage, подлежащего удалению или чтению.
        attachment_id: Идентификатор attachment, используемый для выборки данных.
        field_name: Имя поля модели, которое содержит путь к файлу.
    """
    normalized_name = str(blob_name or "").strip()
    if not normalized_name:
        return
    retries = max(1, int(getattr(settings, "CHAT_ATTACHMENT_DELETE_RETRIES", 8)))
    for attempt in range(retries):
        try:
            storage.delete(normalized_name)
            return
        except PermissionError as exc:
            # Windows can transiently lock files while they are being streamed/read.
            is_locked = getattr(exc, "winerror", None) == 32
            if is_locked and attempt < (retries - 1):
                time.sleep(_attachment_delete_retry_delay(attempt))
                continue
            logger.warning(
                "Failed to delete attachment %s blob for id=%s path=%s",
                field_name,
                attachment_id,
                normalized_name,
                exc_info=True,
            )
            return
        except Exception:
            logger.warning(
                "Failed to delete attachment %s blob for id=%s path=%s",
                field_name,
                attachment_id,
                normalized_name,
                exc_info=True,
            )
            return


def edit_message(user, room: Room, message_id: int, new_content: str) -> Message:
    """Редактирует сообщение.
    
    Args:
        user: Пользователь, для которого выполняется операция.
        room: Комната, в контексте которой выполняется операция.
        message_id: Идентификатор сообщения.
        new_content: Параметр new content, используемый в логике функции.
    
    Returns:
        Объект типа Message, сформированный в ходе выполнения.
    """
    new_content = new_content.strip()
    if not new_content:
        raise MessageValidationError("Текст сообщения не может быть пустым")

    max_len = int(getattr(settings, "CHAT_MESSAGE_MAX_LENGTH", 1000))
    if len(new_content) > max_len:
        raise MessageValidationError("Сообщение слишком длинное")

    with transaction.atomic():
        msg = _load_message_or_raise(room, message_id)

        is_author = msg.user_id == user.pk
        is_moderator = has_permission(room, user, Perm.MANAGE_MESSAGES)

        if not is_author and not is_moderator:
            raise MessageForbiddenError("Вы не можете редактировать это сообщение")

        if is_author and not is_moderator and not _within_edit_window(msg):
            raise MessageForbiddenError("Время на редактирование истекло")

        if not msg.original_content:
            msg.original_content = msg.message_content

        msg.message_content = new_content
        msg.edited_at = timezone.now()
        msg.save(update_fields=["message_content", "edited_at", "original_content"])

    return msg


def delete_message(user, room: Room, message_id: int) -> Message:
    """Удаляет message и выполняет сопутствующие действия.
    
    Args:
        user: Пользователь, для которого выполняется операция.
        room: Экземпляр комнаты, над которой выполняется действие.
        message_id: Идентификатор message, используемый для выборки данных.
    
    Returns:
        Объект типа Message, сформированный в рамках обработки.
    """
    with transaction.atomic():
        msg = _load_message_or_raise(room, message_id)

        if not _can_manage_message(room, user, msg):
            raise MessageForbiddenError("Вы не можете удалить это сообщение")

        msg.is_deleted = True
        msg.deleted_at = timezone.now()
        msg.deleted_by = user
        msg.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

        delete_files = bool(
            getattr(settings, "CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE", True),
        )
        if delete_files:
            attachments = list(
                MessageAttachment.objects.filter(message=msg).only("id", "file", "thumbnail"),
            )
            for attachment in attachments:
                file_field = attachment.file
                _delete_attachment_blob(
                    file_field.storage,
                    file_field.name,
                    attachment_id=attachment.pk,
                    field_name="file",
                )

                thumbnail_field = attachment.thumbnail
                if thumbnail_field:
                    _delete_attachment_blob(
                        thumbnail_field.storage,
                        thumbnail_field.name,
                        attachment_id=attachment.pk,
                        field_name="thumbnail",
                    )

    return msg


# ── Reactions ──────────────────────────────────────────────────────────

def add_reaction(user, room: Room, message_id: int, emoji: str) -> Reaction:
    """Добавляет reaction в целевую коллекцию.
    
    Args:
        user: Пользователь, для которого выполняется операция.
        room: Комната, в контексте которой выполняется операция.
        message_id: Идентификатор сообщения.
        emoji: Эмодзи-реакция, над которой выполняется операция.
    
    Returns:
        Объект типа Reaction, сформированный в ходе выполнения.
    """
    emoji = emoji.strip()
    if not emoji or len(emoji) > 32:
        raise MessageValidationError("Некорректный эмодзи")

    if not has_permission(room, user, Perm.ADD_REACTIONS):
        raise MessageForbiddenError("Отсутствует разрешение ADD_REACTIONS")

    msg = Message.objects.filter(pk=message_id, room=room, is_deleted=False).first()
    if not msg:
        raise MessageNotFoundError("Сообщение не найдено")

    reaction, _created = Reaction.objects.get_or_create(
        message=msg, user=user, emoji=emoji,
    )
    return reaction


def remove_reaction(user, room: Room, message_id: int, emoji: str) -> None:
    """Удаляет reaction из целевого набора данных.
    
    Args:
        user: Пользователь, для которого выполняется операция.
        room: Экземпляр комнаты, над которой выполняется действие.
        message_id: Идентификатор message, используемый для выборки данных.
        emoji: Эмодзи-реакция, которую нужно добавить или удалить.
    """
    Reaction.objects.filter(
        message_id=message_id, message__room=room, user=user, emoji=emoji,
    ).delete()


# ── Read State ─────────────────────────────────────────────────────────
def _store_exact_read_receipts(
    user,
    room: Room,
    previous_last_read_message_id: int,
    next_last_read_message_id: int,
    *,
    read_at,
) -> None:
    """Создает точные receipts для сообщений, впервые попавших в read-диапазон."""

    if next_last_read_message_id <= previous_last_read_message_id:
        return

    message_ids = list(
        Message.objects.filter(
            room=room,
            is_deleted=False,
            id__gt=previous_last_read_message_id,
            id__lte=next_last_read_message_id,
        )
        .exclude(user=user)
        .values_list("id", flat=True)
    )
    if not message_ids:
        return

    try:
        MessageReadReceipt.objects.bulk_create(
            [
                MessageReadReceipt(
                    message_id=message_id,
                    user=user,
                    read_at=read_at,
                )
                for message_id in message_ids
            ],
            ignore_conflicts=True,
        )
    except (OperationalError, ProgrammingError) as exc:
        if not _is_missing_read_receipt_table_error(exc):
            raise
        logger.warning(
            "Exact read receipts are temporarily unavailable because the "
            "messages_read_receipt table is missing. Apply migrations.",
        )


def mark_read(user, room: Room, last_read_message_id: int) -> MessageReadState:
    """Помечает read новым состоянием.
    
    Args:
        user: Пользователь, для которого выполняется операция.
        room: Экземпляр комнаты, над которой выполняется действие.
        last_read_message_id: Идентификатор last read message, используемый для выборки данных.
    
    Returns:
        Объект типа MessageReadState, сформированный в рамках обработки.
    """
    if not Message.objects.filter(pk=last_read_message_id, room=room).exists():
        raise MessageNotFoundError("Сообщение не найдено")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                state, created = MessageReadState.objects.select_for_update().get_or_create(
                    user=user, room=room,
                    defaults={"last_read_message_id": last_read_message_id},
                )
                previous_last_read_message_id = 0
                if not created:
                    previous_last_read_message_id = state.last_read_message_id or 0
                    if last_read_message_id > previous_last_read_message_id:
                        state.last_read_message_id = last_read_message_id
                        # Обновляем room-level cursor отдельно от exact receipts,
                        # чтобы unread/open-positioning оставались быстрыми.
                        state.save(update_fields=["last_read_message", "last_read_at"])
                _store_exact_read_receipts(
                    user,
                    room,
                    previous_last_read_message_id,
                    state.last_read_message_id or 0,
                    read_at=state.last_read_at or timezone.now(),
                )
            return state
        except OperationalError:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.1 * (attempt + 1))
    raise OperationalError("база данных заблокирована")

def get_message_readers(user, room: Room, message_id: int) -> dict:
    """Возвращает readers конкретного сообщения, если запрос сделал его автор."""

    message = (
        Message.objects.select_related("user")
        .filter(pk=message_id, room=room, is_deleted=False)
        .first()
    )
    if message is None:
        raise MessageNotFoundError("Сообщение не найдено")
    if message.user_id != user.pk:
        raise MessageForbiddenError("Недостаточно прав для просмотра прочтений")

    if room.kind == Room.Kind.DIRECT:
        try:
            receipt = (
                MessageReadReceipt.objects.filter(message=message)
                .exclude(user=user)
                .order_by("-read_at", "-pk")
                .first()
            )
        except (OperationalError, ProgrammingError) as exc:
            if not _is_missing_read_receipt_table_error(exc):
                raise
            logger.warning(
                "Direct message read receipts are unavailable because the "
                "messages_read_receipt table is missing. Apply migrations.",
            )
            receipt = None
        return {
            "message": message,
            "read_at": receipt.read_at if receipt else None,
            "receipts": [],
        }

    try:
        receipts = list(
            MessageReadReceipt.objects.filter(message=message)
            .exclude(user=user)
            .select_related("user", "user__profile")
            .order_by("-read_at", "-pk")
        )
    except (OperationalError, ProgrammingError) as exc:
        if not _is_missing_read_receipt_table_error(exc):
            raise
        logger.warning(
            "Group/public read receipts are unavailable because the "
            "messages_read_receipt table is missing. Apply migrations.",
        )
        receipts = []
    return {
        "message": message,
        "read_at": None,
        "receipts": receipts,
    }

def get_unread_counts(user) -> list[dict]:
    """Возвращает unread counts из текущего контекста или хранилища.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Список типа list[dict] с результатами операции.
    """
    from roles.models import Membership

    memberships = (
        Membership.objects.filter(user=user, is_banned=False)
        .select_related("room")
    )

    result = []
    rooms = [membership.room for membership in memberships]
    public_room = Room.objects.filter(kind=Room.Kind.PUBLIC).first()
    if public_room is not None and all(public_room.pk != room.pk for room in rooms):
        rooms.append(public_room)

    for room in rooms:
        read_state = MessageReadState.objects.filter(user=user, room=room).first()
        last_read_id = read_state.last_read_message_id if read_state else 0
        unread = (
            Message.objects
            .filter(room=room, is_deleted=False, id__gt=(last_read_id or 0))
            .exclude(user=user)
            .count()
        )
        if unread > 0:
            result.append({"roomId": room.pk, "unreadCount": unread})

    return result

