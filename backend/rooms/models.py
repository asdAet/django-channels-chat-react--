from django.conf import settings
from django.db import models


class Room(models.Model):
    class Kind(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"
        DIRECT = "direct", "Direct"

    name = models.CharField(max_length=50, db_index=True)
    slug = models.CharField(max_length=50, unique=True)
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

    class Meta:
        db_table = "chat_room"

    def __str__(self):
        return str(self.name)
