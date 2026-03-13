from django.contrib import admin

from .models import Membership, PermissionOverride, Role
from .permissions import Perm


def _permission_flags(mask: int) -> str:
    names = [
        perm_name
        for perm in Perm
        if perm and (int(mask) & int(perm))
        for perm_name in [perm.name]
        if perm_name is not None
    ]
    return ", ".join(names) if names else "-"


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "room",
        "name",
        "position",
        "permissions",
        "permission_flags",
        "is_default",
        "created_at",
    )
    search_fields = ("room__slug", "name")
    list_filter = ("is_default", "room__kind")
    ordering = ("room", "-position")
    list_select_related = ("room",)
    readonly_fields = ("created_at", "permission_flags")
    fields = (
        "room",
        "name",
        "color",
        "position",
        "is_default",
        "permissions",
        "permission_flags",
        "created_at",
    )

    @admin.display(description="Permission flags")
    def permission_flags(self, obj: Role) -> str:
        return _permission_flags(int(obj.permissions))


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("room", "user", "role_names", "is_banned", "nickname", "joined_at")
    search_fields = ("room__slug", "user__username", "nickname")
    list_filter = ("is_banned", "room__kind")
    raw_id_fields = ("room", "user", "banned_by")
    filter_horizontal = ("roles",)
    list_select_related = ("room", "user", "banned_by")

    @admin.display(description="Roles")
    def role_names(self, obj: Membership) -> str:
        names = list(obj.roles.order_by("-position", "name").values_list("name", flat=True))
        return ", ".join(names) if names else "@everyone only"


@admin.register(PermissionOverride)
class PermissionOverrideAdmin(admin.ModelAdmin):
    list_display = (
        "room",
        "target_role",
        "target_user",
        "allow",
        "allow_flags",
        "deny",
        "deny_flags",
    )
    search_fields = ("room__slug", "target_role__name", "target_user__username")
    list_filter = ("room__kind",)
    raw_id_fields = ("room", "target_role", "target_user")
    list_select_related = ("room", "target_role", "target_user")

    @admin.display(description="Allow flags")
    def allow_flags(self, obj: PermissionOverride) -> str:
        return _permission_flags(int(obj.allow))

    @admin.display(description="Deny flags")
    def deny_flags(self, obj: PermissionOverride) -> str:
        return _permission_flags(int(obj.deny))
