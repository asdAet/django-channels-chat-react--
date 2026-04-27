from __future__ import annotations

from django.db.models import QuerySet

from auditlog.models import AuditEvent


class AuditEventRepository:
    """Класс AuditEventRepository инкапсулирует связанную бизнес-логику модуля."""
    @staticmethod
    def create(**kwargs) -> AuditEvent:
        """Создает данные.
        
        Args:
            **kwargs: Дополнительные именованные аргументы вызова.
        
        Returns:
            Объект типа AuditEvent, сформированный в ходе выполнения.
        """
        return AuditEvent.objects.create(**kwargs)

    @staticmethod
    def all() -> QuerySet[AuditEvent]:
        """Вспомогательная функция `all` реализует внутренний шаг бизнес-логики.
        
        Returns:
            Объект типа QuerySet[AuditEvent], сформированный в ходе выполнения.
        """
        return AuditEvent.objects.all()
