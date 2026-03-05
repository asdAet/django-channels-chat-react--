from django.conf import settings
from django.db import models

from rooms.models import Room


class ChatRole(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"
        BLOCKED = "blocked", "Blocked"

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="roles",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_roles",
    )
    role = models.CharField(max_length=16, choices=Role.choices, db_index=True)
    username_snapshot = models.CharField(max_length=150, db_index=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="granted_chat_roles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_chatrole"
        constraints = [
            models.UniqueConstraint(fields=["room", "user"], name="chat_role_room_user_uniq"),
        ]
        indexes = [
            models.Index(fields=["room", "role"], name="chat_role_room_role_idx"),
        ]

    def __str__(self):
        return f"{self.room.slug}:{self.user.username}:{self.role}"
