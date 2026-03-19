"""Business logic for room creation and direct messaging."""

import hashlib
import hmac
import time

from django.conf import settings
from django.db import IntegrityError, OperationalError, transaction

from roles.models import Membership, Role
from users.identity import user_public_username

from .models import Room


def direct_pair_key(user_a_id: int, user_b_id: int) -> str:
    """Вспомогательная функция `direct_pair_key` реализует внутренний шаг бизнес-логики.
    
    Args:
        user_a_id: Идентификатор user a.
        user_b_id: Идентификатор user b.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    low, high = sorted([int(user_a_id), int(user_b_id)])
    return f"{low}:{high}"


def direct_room_slug(pair_key: str) -> str:
    """Вспомогательная функция `direct_room_slug` реализует внутренний шаг бизнес-логики.
    
    Args:
        pair_key: Параметр pair key, используемый в логике функции.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    salt = str(getattr(settings, "CHAT_DIRECT_SLUG_SALT", "") or settings.SECRET_KEY)
    digest = hmac.new(
        salt.encode("utf-8"),
        pair_key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:24]
    return f"dm_{digest}"


def parse_pair_key_users(pair_key: str | None) -> tuple[int, int] | None:
    """Разбирает pair key users из входных данных с валидацией формата.
    
    Args:
        pair_key: Ключ пары разрешений allow/deny.
    
    Returns:
        Кортеж типа tuple[int, int] | None с результатами операции.
    """
    if not pair_key or ":" not in pair_key:
        return None
    first, second = pair_key.split(":", 1)
    try:
        return int(first), int(second)
    except (TypeError, ValueError):
        return None


# -- Membership helpers --------------------------------------------------

def ensure_membership(room: Room, user, role_name: str | None = None) -> Membership:
    """Гарантирует корректность состояния membership перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
        role_name: Данные role name, участвующие в обработке текущей операции.
    
    Returns:
        Объект типа Membership, сформированный в рамках обработки.
    """
    membership, _ = Membership.objects.get_or_create(
        room=room,
        user=user,
    )

    if role_name and room.kind != Room.Kind.DIRECT:
        role = Role.objects.filter(room=room, name=role_name).first()
        if not role:
            # Create default roles for this room if missing
            roles = Role.create_defaults_for_room(room)
            role = roles.get(role_name)
        if role:
            membership.roles.add(role)

    return membership


def ensure_room_owner(room: Room) -> None:
    """Гарантирует корректность состояния room owner перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    """
    if not room.created_by:
        return
    ensure_membership(room, room.created_by, role_name=Role.OWNER)


def ensure_direct_memberships(room: Room, initiator, peer) -> None:
    """Гарантирует корректность состояния direct memberships перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        initiator: Данные initiator, участвующие в обработке текущей операции.
        peer: Данные peer, участвующие в обработке текущей операции.
    """
    if room.kind != Room.Kind.DIRECT:
        room.kind = Room.Kind.DIRECT
        room.save(update_fields=["kind"])

    pair_key = direct_pair_key(initiator.pk, peer.pk)
    if room.direct_pair_key != pair_key:
        room.direct_pair_key = pair_key
        room.save(update_fields=["direct_pair_key"])

    participant_ids = {int(initiator.pk), int(peer.pk)}
    Membership.objects.filter(room=room).exclude(user_id__in=participant_ids).delete()
    for participant in (initiator, peer):
        membership, _ = Membership.objects.get_or_create(room=room, user=participant)
        if membership.is_banned:
            membership.is_banned = False
            membership.ban_reason = ""
            membership.banned_by = None
            membership.save(update_fields=["is_banned", "ban_reason", "banned_by"])




# -- Direct room creation -----------------------------------------------

def _create_or_get_direct_room(initiator, target, pair_key: str, slug: str):
    """Создает or get direct room и возвращает созданную сущность.
    
    Args:
        initiator: Данные initiator, участвующие в обработке текущей операции.
        target: Данные target, участвующие в обработке текущей операции.
        pair_key: Ключ пары разрешений allow/deny.
        slug: Данные slug, участвующие в обработке текущей операции.
    
    Returns:
        Функция не возвращает значение.
    """
    initiator_ref = user_public_username(initiator) or f"user_{initiator.pk}"
    target_ref = user_public_username(target) or f"user_{target.pk}"
    room_display_name = f"{initiator_ref} - {target_ref}"[:50]

    room, created = Room.objects.get_or_create(
        direct_pair_key=pair_key,
        defaults={
            "slug": slug,
            "name": room_display_name,
            "kind": Room.Kind.DIRECT,
            "created_by": initiator,
        },
    )

    changed_fields = []
    if room.kind != Room.Kind.DIRECT:
        room.kind = Room.Kind.DIRECT
        changed_fields.append("kind")
    if not room.slug:
        room.slug = slug
        changed_fields.append("slug")
    if not room.name:
        room.name = room_display_name
        changed_fields.append("name")
    if changed_fields:
        room.save(update_fields=changed_fields)

    return room, created


def ensure_direct_room_with_retry(initiator, target, pair_key: str, slug: str):
    """Гарантирует корректность состояния direct room with retry перед выполнением операции.
    
    Args:
        initiator: Данные initiator, участвующие в обработке текущей операции.
        target: Данные target, участвующие в обработке текущей операции.
        pair_key: Ключ пары разрешений allow/deny.
        slug: Данные slug, участвующие в обработке текущей операции.
    
    Returns:
        Функция не возвращает значение.
    """
    attempts = max(1, int(getattr(settings, "CHAT_DIRECT_START_RETRIES", 3)))

    for attempt in range(attempts):
        try:
            with transaction.atomic():
                return _create_or_get_direct_room(initiator, target, pair_key, slug)
        except IntegrityError:
            room = Room.objects.filter(direct_pair_key=pair_key).first()
            if room:
                return room, False
            if attempt == attempts - 1:
                raise
        except OperationalError as exc:
            room = Room.objects.filter(direct_pair_key=pair_key).first()
            if room:
                return room, False
            if "locked" not in str(exc).lower() or attempt == attempts - 1:
                raise
            time.sleep(0.05 * (attempt + 1))

    raise OperationalError("Не удалось создать личную комнату")


def direct_peer_for_user(room: Room, user):
    """Вспомогательная функция `direct_peer_for_user` реализует внутренний шаг бизнес-логики.
    
    Args:
        room: Комната, в контексте которой выполняется операция.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    peer_membership = (
        Membership.objects.filter(room=room)
        .exclude(user=user)
        .select_related("user", "user__profile")
        .order_by("id")
        .first()
    )
    if not peer_membership:
        return None
    return peer_membership.user


