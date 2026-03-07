"""Shared helpers for the friends app."""

from __future__ import annotations

from friends.models import Friendship


def get_from_user_id(obj: Friendship) -> int | None:
    from_user_id = getattr(obj, "from_user_id", None)
    if from_user_id is not None:
        return int(from_user_id)
    from_user_pk = getattr(getattr(obj, "from_user", None), "pk", None)
    return int(from_user_pk) if from_user_pk is not None else None


def get_to_user_id(obj: Friendship) -> int | None:
    to_user_id = getattr(obj, "to_user_id", None)
    if to_user_id is not None:
        return int(to_user_id)
    to_user_pk = getattr(getattr(obj, "to_user", None), "pk", None)
    return int(to_user_pk) if to_user_pk is not None else None
