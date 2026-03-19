from django.apps import AppConfig


class RolesConfig(AppConfig):
    """Класс RolesConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "roles"

    def ready(self):
        """Инициализирует интеграции и сигналы при запуске приложения."""
        import roles.signals  # noqa: F401
