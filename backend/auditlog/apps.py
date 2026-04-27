from django.apps import AppConfig


class AuditlogConfig(AppConfig):
    """Класс AuditlogConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "auditlog"
