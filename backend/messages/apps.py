from django.apps import AppConfig


class MessagesConfig(AppConfig):
    """Класс MessagesConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "messages"
    label = "chat_messages"

    def ready(self):
        import messages.signals  # noqa: F401
