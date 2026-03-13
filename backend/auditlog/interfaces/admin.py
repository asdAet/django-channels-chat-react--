import csv
import json
from datetime import datetime
from typing import Any, cast

from django.contrib import admin
from django.db.models import Q, QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest
from django.urls import path, reverse
from django.utils import timezone
from django.utils.text import slugify

from auditlog.models import AuditEvent


class StatusFamilyFilter(admin.SimpleListFilter):
    title = "Группа статусов"
    parameter_name = "status_family"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        del request, model_admin
        return [
            ("2xx", "2xx"),
            ("3xx", "3xx"),
            ("4xx", "4xx"),
            ("5xx", "5xx"),
        ]

    def queryset(
        self,
        request: HttpRequest,
        queryset: QuerySet[Any] | None,
    ) -> QuerySet[Any] | None:
        del request
        if queryset is None:
            return None
        value = self.value()
        if value == "2xx":
            return queryset.filter(status_code__gte=200, status_code__lt=300)
        if value == "3xx":
            return queryset.filter(status_code__gte=300, status_code__lt=400)
        if value == "4xx":
            return queryset.filter(status_code__gte=400, status_code__lt=500)
        if value == "5xx":
            return queryset.filter(status_code__gte=500, status_code__lt=600)
        return queryset


class HasActorFilter(admin.SimpleListFilter):
    title = "Есть актёр"
    parameter_name = "has_actor"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        del request, model_admin
        return [
            ("yes", "Да"),
            ("no", "Нет"),
        ]

    def queryset(
        self,
        request: HttpRequest,
        queryset: QuerySet[Any] | None,
    ) -> QuerySet[Any] | None:
        del request
        if queryset is None:
            return None
        value = self.value()
        if value == "yes":
            return queryset.exclude(actor_user_id_snapshot__isnull=True)
        if value == "no":
            return queryset.filter(actor_user_id_snapshot__isnull=True)
        return queryset


class HasRequestIdFilter(admin.SimpleListFilter):
    title = "Есть request_id"
    parameter_name = "has_request_id"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        del request, model_admin
        return [
            ("yes", "Да"),
            ("no", "Нет"),
        ]

    def queryset(
        self,
        request: HttpRequest,
        queryset: QuerySet[Any] | None,
    ) -> QuerySet[Any] | None:
        del request
        if queryset is None:
            return None
        value = self.value()
        if value == "yes":
            return queryset.exclude(request_id__isnull=True).exclude(request_id__exact="")
        if value == "no":
            return queryset.filter(Q(request_id__isnull=True) | Q(request_id__exact=""))
        return queryset


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    change_list_template = "admin/auditlog/auditevent/change_list.html"
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
    list_filter = (
        "action",
        "protocol",
        "method",
        "success",
        "is_authenticated",
        "status_code",
        "created_at",
        StatusFamilyFilter,
        HasActorFilter,
        HasRequestIdFilter,
    )
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
    date_hierarchy = "created_at"
    actions = ("export_selected_as_csv", "export_selected_as_json", "export_selected_as_jsonl")

    @admin.display(description="Path")
    def short_path(self, obj):
        path_value = obj.path or ""
        return path_value if len(path_value) <= 80 else f"{path_value[:77]}..."

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Экспортировать выбранные (CSV)")
    def export_selected_as_csv(self, _request, queryset):
        return self._build_export_response(queryset, export_format="csv")

    @admin.action(description="Экспортировать выбранные (JSON)")
    def export_selected_as_json(self, _request, queryset):
        return self._build_export_response(queryset, export_format="json")

    @admin.action(description="Экспортировать выбранные (JSONL)")
    def export_selected_as_jsonl(self, _request, queryset):
        return self._build_export_response(queryset, export_format="jsonl")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "export/",
                self.admin_site.admin_view(self.export_view),
                name="auditlog_auditevent_export",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = dict(extra_context or {})
        params = request.GET.copy()
        params.pop("format", None)
        query_string = params.urlencode()
        export_base = reverse("admin:auditlog_auditevent_export")
        separator = f"?{query_string}&" if query_string else "?"
        extra_context["export_csv_url"] = f"{export_base}{separator}format=csv"
        extra_context["export_json_url"] = f"{export_base}{separator}format=json"
        extra_context["export_jsonl_url"] = f"{export_base}{separator}format=jsonl"
        return super().changelist_view(request, extra_context=extra_context)

    def export_view(self, request):
        export_format = (request.GET.get("format") or "csv").strip().lower()
        if export_format not in {"csv", "json", "jsonl"}:
            return HttpResponseBadRequest("Неподдерживаемый формат экспорта".encode("utf-8"))

        queryset = self._get_filtered_queryset(request)
        return self._build_export_response(queryset, export_format=export_format)

    def _get_filtered_queryset(self, request):
        original_get = request.GET
        mutable_get = request.GET.copy()
        mutable_get.pop("format", None)
        request.GET = mutable_get
        try:
            changelist = self.get_changelist_instance(request)
            return changelist.get_queryset(request)
        finally:
            request.GET = original_get

    def _serialize_event(self, event: AuditEvent) -> dict[str, object]:
        created_at = cast(datetime | None, event.created_at)
        return {
            "id": event.pk,
            "createdAt": created_at.isoformat() if created_at else None,
            "action": event.action,
            "protocol": event.protocol,
            "actorUserId": event.actor_user_id_snapshot,
            "actorUsername": event.actor_username_snapshot,
            "isAuthenticated": event.is_authenticated,
            "method": event.method,
            "path": event.path,
            "statusCode": event.status_code,
            "success": event.success,
            "ip": event.ip,
            "requestId": event.request_id,
            "metadata": event.metadata or {},
        }

    def _build_export_filename(self, export_format: str) -> str:
        timestamp = timezone.now().strftime("%Y%m%d-%H%M%S")
        return f"audit-events-{timestamp}.{slugify(export_format) or export_format}"

    def _build_export_response(self, queryset, *, export_format: str) -> HttpResponse:
        if export_format == "csv":
            return self._as_csv(queryset, filename=self._build_export_filename("csv"))
        if export_format == "json":
            return self._as_json(queryset, filename=self._build_export_filename("json"))
        if export_format == "jsonl":
            return self._as_jsonl(queryset, filename=self._build_export_filename("jsonl"))
        return HttpResponseBadRequest("Неподдерживаемый формат экспорта".encode("utf-8"))

    def _as_csv(self, queryset, *, filename: str) -> HttpResponse:
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        fieldnames = [
            "id",
            "createdAt",
            "action",
            "protocol",
            "actorUserId",
            "actorUsername",
            "isAuthenticated",
            "method",
            "path",
            "statusCode",
            "success",
            "ip",
            "requestId",
            "metadata",
        ]
        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()
        for event in queryset.iterator(chunk_size=1000):
            row = self._serialize_event(event)
            row["metadata"] = json.dumps(row["metadata"], ensure_ascii=False, separators=(",", ":"))
            writer.writerow(row)
        return response

    def _as_json(self, queryset, *, filename: str) -> HttpResponse:
        payload = [self._serialize_event(event) for event in queryset.iterator(chunk_size=1000)]
        response = HttpResponse(content_type="application/json; charset=utf-8")
        response.write(
            json.dumps(payload, ensure_ascii=False, indent=2, default=self._json_default).encode("utf-8")
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _as_jsonl(self, queryset, *, filename: str) -> HttpResponse:
        lines = []
        for event in queryset.iterator(chunk_size=1000):
            lines.append(
                json.dumps(self._serialize_event(event), ensure_ascii=False, default=self._json_default)
            )
        response = HttpResponse(content_type="application/x-ndjson; charset=utf-8")
        response.write(("\n".join(lines) + ("\n" if lines else "")).encode("utf-8"))
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @staticmethod
    def _json_default(value):
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)
