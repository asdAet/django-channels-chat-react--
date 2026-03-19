from django.contrib import admin

from .models import Room
from roles.models import PermissionOverride, Role


class RoleInline(admin.TabularInline):
    """Класс RoleInline настраивает поведение сущности в Django Admin."""
    model = Role
    extra = 0
    show_change_link = True
    fields = ("name", "position", "color", "permissions", "is_default")


class PermissionOverrideInline(admin.TabularInline):
    """Класс PermissionOverrideInline настраивает поведение сущности в Django Admin."""
    model = PermissionOverride
    extra = 0
    show_change_link = True
    fields = ("target_role", "target_user", "allow", "deny")
    raw_id_fields = ("target_role", "target_user")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """Класс RoomAdmin настраивает поведение сущности в Django Admin."""
    list_display = ("name", "slug", "kind", "direct_pair_key", "created_by")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug", "direct_pair_key")
    list_filter = ("kind",)
    inlines = (RoleInline, PermissionOverrideInline)
