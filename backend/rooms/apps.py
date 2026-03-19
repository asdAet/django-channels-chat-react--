from django.apps import AppConfig


class RoomsConfig(AppConfig):
    """Класс RoomsConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "rooms"

    def ready(self):
        """Инициализирует интеграции и сигналы при запуске приложения."""
        import rooms.signals  # noqa: F401
