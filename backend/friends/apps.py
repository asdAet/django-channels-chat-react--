from django.apps import AppConfig


class FriendsConfig(AppConfig):
    """Класс FriendsConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "friends"

    def ready(self):
        """Инициализирует интеграции и сигналы при запуске приложения."""
        import friends.signals  # noqa: F401
