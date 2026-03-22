from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Класс MessageAdmin настраивает поведение сущности в Django Admin."""
    list_display = ("username", "user", "room", "short_message", "date_added")
    list_filter = ("room", "date_added", "user")
    search_fields = ("username", "user__username", "message_content", "room__name", "room__public_id")
    date_hierarchy = "date_added"
    fields = ("username", "user", "room", "message_content", "profile_pic", "date_added")

    @admin.display(description="Message")
    def short_message(self, obj):
        """Формирует краткое представление message.
        
        Args:
            obj: Параметр obj, используемый в логике функции.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        if obj.message_content:
            return (obj.message_content[:50] + "...") if len(obj.message_content) > 50 else obj.message_content
        return ""
