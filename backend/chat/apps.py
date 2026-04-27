from django.apps import AppConfig


class ChatConfig(AppConfig):
    """Класс ChatConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "chat"
