from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from django.db import models

from rooms.models import Room


class Role(models.Model):
    EVERYONE: str
    VIEWER: str
    MEMBER: str
    MODERATOR: str
    ADMIN: str
    OWNER: str

    room: Room
    name: str
    color: str
    position: int
    permissions: int
    is_default: bool
    created_at: datetime
    room_id: int

    def __str__(self) -> str: ...

    @classmethod
    def create_defaults_for_room(cls, room: Room) -> dict[str, Role]: ...


class Membership(models.Model):
    room: Room
    user: Any
    roles: Any
    nickname: str
    is_banned: bool
    ban_reason: str
    banned_by: Any | None
    muted_until: datetime | None
    muted_by: Any | None
    joined_at: datetime
    room_id: int
    user_id: int
    banned_by_id: Optional[int]
    muted_by_id: Optional[int]

    def __str__(self) -> str: ...

    @property
    def display_name(self) -> str: ...

    @property
    def is_muted(self) -> bool: ...


class PermissionOverride(models.Model):
    room: Room
    target_role: Role | None
    target_user: Any | None
    allow: int
    deny: int
    room_id: int
    target_role_id: Optional[int]
    target_user_id: Optional[int]

    def __str__(self) -> str: ...
