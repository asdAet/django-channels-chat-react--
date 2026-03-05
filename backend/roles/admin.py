from django.contrib import admin

from .models import ChatRole


@admin.register(ChatRole)
class ChatRoleAdmin(admin.ModelAdmin):
    list_display = ("room", "user", "role", "username_snapshot", "granted_by", "created_at")
    search_fields = ("room__slug", "user__username", "username_snapshot")
    list_filter = ("role", "room__kind")
