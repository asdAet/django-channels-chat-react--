"""Business logic for room creation and direct messaging."""

import hashlib
import hmac
import time

from django.conf import settings
from django.db import IntegrityError, OperationalError, transaction

from roles.models import Membership, Role

from .models import Room


def direct_pair_key(user_a_id: int, user_b_id: int) -> str:
    low, high = sorted([int(user_a_id), int(user_b_id)])
    return f"{low}:{high}"


def direct_room_slug(pair_key: str) -> str:
    salt = str(getattr(settings, "CHAT_DIRECT_SLUG_SALT", "") or settings.SECRET_KEY)
    digest = hmac.new(
        salt.encode("utf-8"),
        pair_key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:24]
    return f"dm_{digest}"


def parse_pair_key_users(pair_key: str | None) -> tuple[int, int] | None:
    if not pair_key or ":" not in pair_key:
        return None
    first, second = pair_key.split(":", 1)
    try:
        return int(first), int(second)
    except (TypeError, ValueError):
        return None


# ── Membership helpers ──────────────────────────────────────────────────

def ensure_membership(room: Room, user, role_name: str | None = None) -> Membership:
    """Get or create a Membership, optionally assigning a role by name.

    If the room has no roles yet, creates the default role set first.
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
    """Ensure the room creator has Owner membership."""
    if not room.created_by:
        return
    ensure_membership(room, room.created_by, role_name=Role.OWNER)


def ensure_direct_memberships(room: Room, initiator, peer) -> None:
    """Create and normalize memberships for both DM participants.

    Direct rooms are strict:
    - `kind=direct`;
    - exactly two members from `direct_pair_key`;
    - no extra participants.
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


# ── Backward-compatible aliases ─────────────────────────────────────────

def ensure_role(room: Room, user, role: str, granted_by=None):
    """Backward-compatible wrapper: maps old role strings to new system."""
    _OLD_TO_NEW = {
        "owner": "Owner",
        "admin": "Admin",
        "member": "Member",
        "viewer": "Viewer",
    }
    role_name = _OLD_TO_NEW.get(role, role)
    return ensure_membership(room, user, role_name=role_name)


def ensure_room_owner_role(room: Room):
    """Backward-compatible alias for ensure_room_owner."""
    return ensure_room_owner(room)


def ensure_direct_roles(room: Room, initiator, peer, created: bool = False):
    """Backward-compatible alias for ensure_direct_memberships."""
    return ensure_direct_memberships(room, initiator, peer)


# ── Direct room creation ───────────────────────────────────────────────

def _create_or_get_direct_room(initiator, target, pair_key: str, slug: str):
    room, created = Room.objects.get_or_create(
        direct_pair_key=pair_key,
        defaults={
            "slug": slug,
            "name": f"{initiator.username} - {target.username}",
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
        room.name = f"{initiator.username} - {target.username}"
        changed_fields.append("name")
    if changed_fields:
        room.save(update_fields=changed_fields)

    return room, created


def ensure_direct_room_with_retry(initiator, target, pair_key: str, slug: str):
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
    """Get the other participant in a direct room."""
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
