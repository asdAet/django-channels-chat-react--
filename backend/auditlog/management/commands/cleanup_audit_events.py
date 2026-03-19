from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from auditlog.models import AuditEvent


class Command(BaseCommand):
    """Класс Command реализует management-команду Django."""
    help = "Удаляет события аудита старше N дней."

    def add_arguments(self, parser):
        """Добавляет arguments в целевую коллекцию.
        
        Args:
            parser: Парсер аргументов management-команды.
        """
        parser.add_argument(
            "--days",
            type=int,
            default=int(getattr(settings, "AUDIT_RETENTION_DAYS", 180)),
            help="Период хранения в днях (по умолчанию из AUDIT_RETENTION_DAYS).",
        )

    def handle(self, *args, **options):
        """Обрабатывает данные.
        
        Args:
            *args: Дополнительные позиционные аргументы вызова.
            **options: Опции, переданные в management-команду.
        """
        days = int(options["days"])
        if days < 1:
            raise CommandError("--days должно быть >= 1")

        cutoff = timezone.now() - timezone.timedelta(days=days)
        deleted, _details = AuditEvent.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Удалено {deleted} событий аудита старше {days} дней"))
