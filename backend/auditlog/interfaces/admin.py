from django.contrib import admin

from auditlog.models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "created_at",
        "action",
        "actor_user_id_snapshot",
        "actor_username_snapshot",
        "protocol",
        "method",
        "status_code",
        "success",
        "ip",
        "short_path",
    )
    list_filter = ("action", "protocol", "method", "success", "is_authenticated", "status_code", "created_at")
    search_fields = (
        "action",
        "actor_user_id_snapshot",
        "actor_username_snapshot",
        "path",
        "ip",
        "request_id",
    )
    readonly_fields = (
        "created_at",
        "action",
        "protocol",
        "actor_user",
        "actor_user_id_snapshot",
        "actor_username_snapshot",
        "is_authenticated",
        "method",
        "path",
        "status_code",
        "success",
        "ip",
        "request_id",
        "metadata",
    )
    fields = readonly_fields
    ordering = ("-created_at", "-id")

    @admin.display(description="Path")
    def short_path(self, obj):
        path = obj.path or ""
        return path if len(path) <= 80 else f"{path[:77]}..."

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
