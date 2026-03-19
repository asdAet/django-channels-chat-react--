from __future__ import annotations

from typing import Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from users.avatar_service import group_avatar_upload_to

GROUP_PUBLIC_ID_VALIDATOR = RegexValidator(
    regex=r"^-[1-9]\d{9}$",
    message="public_id must be a negative 10-digit numeric value.",
)


class Room(models.Model):
    class Kind(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"
        DIRECT = "direct", "Direct"
        GROUP = "group", "Group"

    name = models.CharField(max_length=50, db_index=True)
    slug = models.CharField(max_length=60, unique=True)
    kind = models.CharField(
        max_length=10,
        choices=Kind.choices,
        default=Kind.PRIVATE,
        db_index=True,
    )
    direct_pair_key = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_rooms",
    )
    created_by_id: Optional[int]

    description = models.TextField(blank=True, default="", max_length=2000)
    avatar = models.ImageField(upload_to=group_avatar_upload_to, null=True, blank=True)
    avatar_crop_x = models.FloatField(null=True, blank=True)
    avatar_crop_y = models.FloatField(null=True, blank=True)
    avatar_crop_width = models.FloatField(null=True, blank=True)
    avatar_crop_height = models.FloatField(null=True, blank=True)
    is_public = models.BooleanField(
        default=False,
        help_text="Public groups are discoverable and joinable without invite.",
    )
    public_id = models.CharField(
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        validators=[GROUP_PUBLIC_ID_VALIDATOR],
        help_text="Negative 10-digit public fallback id for groups.",
    )
    slow_mode_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Minimum delay between messages per member (0=off).",
    )
    join_approval_required = models.BooleanField(
        default=False,
        help_text="Require admin approval for join requests.",
    )
    max_members = models.PositiveIntegerField(default=200000)
    member_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "chat_room"

    def __str__(self):
        return str(self.name)

    @property
    def is_group(self) -> bool:
        return self.kind == self.Kind.GROUP

    def save(self, *args, **kwargs):
        if self.public_id and self.kind != self.Kind.GROUP:
            raise ValidationError({"public_id": "public_id is supported only for groups."})

        if self.pk is not None:
            previous = type(self).objects.filter(pk=self.pk).values("public_id", "kind").first()
            if previous is not None:
                old_public_id = previous.get("public_id")
                if old_public_id and old_public_id != self.public_id:
                    raise ValidationError({"public_id": "public_id is immutable."})
        super().save(*args, **kwargs)
