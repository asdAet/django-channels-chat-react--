
"""Модуль apps реализует прикладную логику подсистемы users."""


from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Класс UsersConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        """Инициализирует интеграции и сигналы при запуске приложения."""
        import users.signals
