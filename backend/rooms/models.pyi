from __future__ import annotations

from typing import Any, Optional

from django.db import models
from django.db.models.fields.files import FieldFile


class Room(models.Model):
    class Kind(models.TextChoices):
        PUBLIC: str
        PRIVATE: str
        DIRECT: str
        GROUP: str

    name: str
    kind: str
    direct_pair_key: str | None
    created_by: Any | None
    created_by_id: Optional[int]
    description: str
    avatar: FieldFile
    avatar_crop_x: float | None
    avatar_crop_y: float | None
    avatar_crop_width: float | None
    avatar_crop_height: float | None
    is_public: bool
    public_id: str | None
    slow_mode_seconds: int
    join_approval_required: bool
    max_members: int
    member_count: int

    @property
    def is_group(self) -> bool: ...

    def __str__(self) -> str: ...
    def save(self, *args, **kwargs) -> None: ...
