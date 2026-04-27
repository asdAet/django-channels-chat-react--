"""Friendship model — one row per direction (A→B)."""

from django.conf import settings
from django.db import models


class Friendship(models.Model):
    """Модель Friendship описывает структуру и поведение данных в приложении."""
    class Status(models.TextChoices):
        """Класс Status инкапсулирует связанную бизнес-логику модуля."""
        PENDING = "pending"
        ACCEPTED = "accepted"
        DECLINED = "declined"
        BLOCKED = "blocked"

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_sent",
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_received",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        db_table = "friends_friendship"
        constraints = [
            models.UniqueConstraint(
                fields=["from_user", "to_user"],
                name="friendship_unique_pair",
            ),
            models.CheckConstraint(
                check=~models.Q(from_user=models.F("to_user")),
                name="friendship_no_self",
            ),
        ]
        indexes = [
            models.Index(fields=["to_user", "status"], name="friendship_to_status_idx"),
            models.Index(fields=["from_user", "status"], name="friendship_from_status_idx"),
        ]

    def __str__(self):
        """Возвращает человекочитаемое строковое представление объекта.
        
        Returns:
            Функция не возвращает значение.
        """
        from_user_id = getattr(self, "from_user_id", None)
        if from_user_id is None:
            from_user_id = getattr(getattr(self, "from_user", None), "pk", "?")
        to_user_id = getattr(self, "to_user_id", None)
        if to_user_id is None:
            to_user_id = getattr(getattr(self, "to_user", None), "pk", "?")
        return f"{from_user_id}->{to_user_id}:{self.status}"
