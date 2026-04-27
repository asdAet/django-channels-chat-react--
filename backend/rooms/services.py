"""Business logic for room creation and direct messaging."""

from __future__ import annotations

import time

from django.conf import settings
from django.db import IntegrityError, OperationalError, transaction

from roles.models import Membership, Role
from users.identity import user_public_username

from .models import Room


def direct_pair_key(user_a_id: int, user_b_id: int) -> str:
    """Return a stable key for a direct chat participant pair."""
    low, high = sorted([int(user_a_id), int(user_b_id)])
    return f"{low}:{high}"


def parse_pair_key_users(pair_key: str | None) -> tuple[int, int] | None:
    """Parse a direct chat pair key back into two user ids."""
    if not pair_key or ":" not in pair_key:
        return None
    first, second = pair_key.split(":", 1)
    try:
        return int(first), int(second)
    except (TypeError, ValueError):
        return None


# -- Membership helpers --------------------------------------------------

def ensure_membership(room: Room, user, role_name: str | None = None) -> Membership:
    """Ensure that the user has a membership in the room."""
    membership, _ = Membership.objects.get_or_create(room=room, user=user)

    if role_name and room.kind != Room.Kind.DIRECT:
        role = Role.objects.filter(room=room, name=role_name).first()
        if not role:
            roles = Role.create_defaults_for_room(room)
            role = roles.get(role_name)
        if role:
            membership.roles.add(role)

    return membership


def ensure_room_owner(room: Room) -> None:
    """Ensure that the room creator has the owner role where applicable."""
    if not room.created_by:
        return
    ensure_membership(room, room.created_by, role_name=Role.OWNER)


def ensure_direct_memberships(room: Room, initiator, peer) -> None:
    """Keep direct chat memberships in sync with the participant pair."""
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

def _create_or_get_direct_room(initiator, target, pair_key: str):
    """Create or fetch a direct room identified only by the participant pair."""
    initiator_ref = user_public_username(initiator) or f"user_{initiator.pk}"
    target_ref = user_public_username(target) or f"user_{target.pk}"
    room_display_name = f"{initiator_ref} - {target_ref}"[:50]

    room, created = Room.objects.get_or_create(
        direct_pair_key=pair_key,
        defaults={
            "name": room_display_name,
            "kind": Room.Kind.DIRECT,
            "created_by": initiator,
        },
    )

    changed_fields: list[str] = []
    if room.kind != Room.Kind.DIRECT:
        room.kind = Room.Kind.DIRECT
        changed_fields.append("kind")
    if not room.name:
        room.name = room_display_name
        changed_fields.append("name")
    if changed_fields:
        room.save(update_fields=changed_fields)

    return room, created


def ensure_direct_room_with_retry(initiator, target, pair_key: str):
    """Create or fetch a direct room with retry on transient database errors."""
    attempts = max(1, int(getattr(settings, "CHAT_DIRECT_START_RETRIES", 3)))

    for attempt in range(attempts):
        try:
            with transaction.atomic():
                # Direct room identity is defined only by the participant pair.
                return _create_or_get_direct_room(initiator, target, pair_key)
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
    """Return the peer user for a direct room relative to the current user."""
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
