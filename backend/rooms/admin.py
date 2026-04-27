from django.contrib import admin

from roles.models import PermissionOverride, Role

from .models import Room


class RoleInline(admin.TabularInline):
    model = Role
    extra = 0
    show_change_link = True
    fields = ("name", "position", "color", "permissions", "is_default")


class PermissionOverrideInline(admin.TabularInline):
    model = PermissionOverride
    extra = 0
    show_change_link = True
    fields = ("target_role", "target_user", "allow", "deny")
    raw_id_fields = ("target_role", "target_user")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """Admin configuration for room records."""

    list_display = ("id", "name", "kind", "direct_pair_key", "created_by")
    search_fields = ("id", "name", "direct_pair_key", "public_id")
    list_filter = ("kind",)
    inlines = (RoleInline, PermissionOverrideInline)
