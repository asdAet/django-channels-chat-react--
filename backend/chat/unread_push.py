"""Push helpers for authoritative unread room snapshots over inbox websocket."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

from direct_inbox.state import user_group_name
from messages.models import MessageReadState
from roles.models import Membership
from rooms.models import Room

from .services import get_unread_counts


def _to_positive_int(value: int | str | None) -> int | None:
    """Coerces supported user id values into a positive integer."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, int):
        parsed = value
    else:
        normalized = value.strip()
        if not normalized:
            return None
        try:
            parsed = int(normalized)
        except ValueError:
            return None

    if parsed <= 0:
        return None
    return parsed


def build_room_unread_state(user) -> dict[str, Any]:
    """Builds the authoritative unread snapshot for every room of a user."""
    counts: dict[str, int] = {}
    for item in get_unread_counts(user):
        room_id = int(item["roomId"])
        unread_count = int(item["unreadCount"])
        if room_id <= 0 or unread_count <= 0:
            continue
        counts[str(room_id)] = unread_count

    room_ids = [int(room_id) for room_id in counts.keys()]
    return {
        "dialogs": len(room_ids),
        "roomIds": room_ids,
        "counts": counts,
    }


def _normalize_user_ids(user_ids: Iterable[int | str | None]) -> list[int]:
    """Normalizes raw user identifiers to a unique positive integer list."""
    normalized: list[int] = []
    seen: set[int] = set()

    for raw_user_id in user_ids:
        user_id = _to_positive_int(raw_user_id)
        if user_id is None:
            continue
        if user_id in seen:
            continue
        seen.add(user_id)
        normalized.append(user_id)

    return normalized


def get_room_unread_recipient_user_ids(room: Room) -> list[int]:
    """Returns users whose authoritative unread snapshot may change for a room."""
    if room.kind == Room.Kind.PUBLIC:
        return _normalize_user_ids(
            MessageReadState.objects.filter(room=room)
            .values_list("user_id", flat=True)
            .distinct()
        )

    return _normalize_user_ids(
        Membership.objects.filter(room=room, is_banned=False)
        .exclude(user_id__isnull=True)
        .values_list("user_id", flat=True)
        .distinct()
    )


def build_room_unread_events_for_user_ids(
    user_ids: Iterable[int | str | None],
) -> list[dict[str, Any]]:
    """Builds inbox-ws payloads with authoritative unread snapshots."""
    normalized_user_ids = _normalize_user_ids(user_ids)
    if not normalized_user_ids:
        return []

    user_model = get_user_model()
    users = user_model.objects.filter(pk__in=normalized_user_ids)
    events: list[dict[str, Any]] = []
    for user in users:
        events.append(
            {
                "group": user_group_name(user.pk),
                "payload": {
                    "type": "room_unread_state",
                    "unread": build_room_unread_state(user),
                },
            }
        )

    return events


def broadcast_room_unread_state_for_user_ids(
    user_ids: Iterable[int | str | None],
) -> None:
    """Broadcasts authoritative unread snapshots to inbox websocket groups."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    for event in build_room_unread_events_for_user_ids(user_ids):
        async_to_sync(channel_layer.group_send)(
            event["group"],
            {
                "type": "direct_inbox_event",
                "payload": event["payload"],
            },
        )


def broadcast_room_unread_state_for_room(room: Room) -> None:
    """Broadcasts authoritative unread snapshots to all affected room users."""
    broadcast_room_unread_state_for_user_ids(get_room_unread_recipient_user_ids(room))


def broadcast_room_unread_state_for_user(user) -> None:
    """Broadcasts an authoritative unread snapshot to one user."""
    user_id = getattr(user, "pk", None)
    if user_id is None:
        return
    broadcast_room_unread_state_for_user_ids([user_id])
