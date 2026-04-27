from django.apps import AppConfig


class DirectInboxConfig(AppConfig):
    """Класс DirectInboxConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "direct_inbox"
