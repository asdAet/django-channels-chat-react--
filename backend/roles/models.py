# pyright: reportIncompatibleVariableOverride=false, reportCallIssue=false
"""Discord-style role and membership models.

Role      — per-room role definition with permissions bitmask and hierarchy.
Membership — links a user to a room; carries M2M roles and ban state.

Direct chats have no roles — access is based on Room.direct_pair_key.
"""

from django.conf import settings
from django.db import models
from typing import Optional

from rooms.models import Room

from .permissions import (
    EVERYONE_GROUP_PRIVATE,
    EVERYONE_GROUP_PUBLIC,
    EVERYONE_PRIVATE,
    EVERYONE_PUBLIC,
    PRESET_ADMIN,
    PRESET_MEMBER,
    PRESET_MODERATOR,
    PRESET_OWNER,
    PRESET_VIEWER,
)


class Role(models.Model):
    """Модель Role описывает структуру и поведение данных в приложении."""

    EVERYONE = "@everyone"
    VIEWER = "Viewer"
    MEMBER = "Member"
    MODERATOR = "Moderator"
    ADMIN = "Admin"
    OWNER = "Owner"

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="roles",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        default="#99AAB5",
        help_text="Hex color code, e.g. #FF0000",
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Higher position = more authority. Used to resolve hierarchy.",
    )
    permissions = models.BigIntegerField(
        default=0,
        help_text="Bitwise permission mask (see roles.permissions.Perm).",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="If True, this is the @everyone role (auto-applied to all members).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # Django adds <fk>_id attributes dynamically; annotate them for static analyzers.
    room_id: int

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "roles_role"
        ordering = ["-position"]
        constraints = [
            models.UniqueConstraint(
                fields=["room", "name"],
                name="role_room_name_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["room", "position"], name="role_room_position_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        return f"{self.room_id}:{self.name}"

    # ── Convenience helpers for creating standard roles ──────────────

    @classmethod
    def create_defaults_for_room(cls, room: Room) -> dict[str, "Role"]:
        """Создает defaults for room и возвращает созданную сущность.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
        
        Returns:
            Словарь типа dict[str, 'Role'] с результатами операции.
        """
        if room.kind == Room.Kind.GROUP:
            if room.is_public:
                everyone_perms = int(EVERYONE_GROUP_PUBLIC)
            else:
                everyone_perms = int(EVERYONE_GROUP_PRIVATE)
        elif room.kind == Room.Kind.PUBLIC:
            everyone_perms = int(EVERYONE_PUBLIC)
        else:
            everyone_perms = int(EVERYONE_PRIVATE)

        defaults = [
            (cls.EVERYONE, 0, everyone_perms, True),
            (cls.VIEWER, 10, int(PRESET_VIEWER), False),
            (cls.MEMBER, 20, int(PRESET_MEMBER), False),
            (cls.MODERATOR, 40, int(PRESET_MODERATOR), False),
            (cls.ADMIN, 60, int(PRESET_ADMIN), False),
            (cls.OWNER, 80, int(PRESET_OWNER), False),
        ]

        created = {}
        for name, position, perms, is_def in defaults:
            role, _ = cls.objects.get_or_create(
                room=room,
                name=name,
                defaults={
                    "position": position,
                    "permissions": perms,
                    "is_default": is_def,
                },
            )
            created[name] = role
        return created


class Membership(models.Model):
    """Модель Membership описывает структуру и поведение данных в приложении."""

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_memberships",
    )
    roles = models.ManyToManyField(
        Role,
        related_name="members",
        blank=True,
    )
    nickname = models.CharField(
        max_length=32,
        blank=True,
        default="",
        help_text="Per-room display name (like Discord server nickname).",
    )
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True, default="")
    banned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="bans_issued",
    )
    muted_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Muted until this time (null = not muted).",
    )
    muted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mutes_issued",
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    room_id: int
    user_id: int
    banned_by_id: Optional[int]
    muted_by_id: Optional[int]

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "roles_membership"
        constraints = [
            models.UniqueConstraint(
                fields=["room", "user"],
                name="membership_room_user_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "room"], name="membership_user_room_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        return f"{self.room_id}:{self.user.username}"

    @property
    def display_name(self) -> str:
        """Возвращает отображаемое имя участника в рамках комнаты.

        Returns:
            Никнейм участника в комнате, если он задан, иначе базовый username пользователя.
        """
        return self.nickname or self.user.username

    @property
    def is_muted(self) -> bool:
        """Проверяет условие muted и возвращает логический результат.
        
        Returns:
            Логическое значение результата проверки.
        """
        if self.muted_until is None:
            return False
        from django.utils import timezone
        return self.muted_until > timezone.now()


class PermissionOverride(models.Model):
    """Модель PermissionOverride описывает структуру и поведение данных в приложении."""

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="permission_overrides",
    )
    target_role = models.ForeignKey(
        Role,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="overrides",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="permission_overrides",
    )
    allow = models.BigIntegerField(default=0)
    deny = models.BigIntegerField(default=0)
    # Django adds these concrete foreign-key ids dynamically at runtime.
    room_id: int
    target_role_id: Optional[int]
    target_user_id: Optional[int]

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "roles_permissionoverride"
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(target_role__isnull=False)
                    | models.Q(target_user__isnull=False)
                ),
                name="override_has_target",
            ),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        target = self.target_role or self.target_user
        return f"{self.room_id}:override:{target}"
