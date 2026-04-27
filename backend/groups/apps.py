from django.apps import AppConfig


class GroupsConfig(AppConfig):
    """Класс GroupsConfig инкапсулирует связанную бизнес-логику модуля."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "groups"
