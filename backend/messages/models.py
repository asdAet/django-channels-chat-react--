from django.conf import settings
from django.db import models
from django.utils import timezone

from rooms.models import Room


class Message(models.Model):
    username = models.CharField(max_length=50, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="chat_messages",
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    message_content = models.TextField()
    date_added = models.DateTimeField(default=timezone.now, db_index=True)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "chat_message"
        ordering = ("date_added",)
        indexes = [
            models.Index(fields=["room", "date_added"], name="msg_room_date_idx"),
            models.Index(fields=["username", "date_added"], name="msg_user_date_idx"),
        ]

    def __str__(self):
        name = self.user.username if self.user else self.username
        return f"{name}: {self.message_content}"
