import csv
import json
from datetime import date, datetime
from typing import Any, cast

from django.contrib import admin
from django.db.models import Q, QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest
from django.urls import path, reverse
from django.utils import timezone
from django.utils.text import slugify

from auditlog.models import AuditEvent


class StatusFamilyFilter(admin.SimpleListFilter):
    """Класс StatusFamilyFilter настраивает поведение сущности в Django Admin."""
    title = "Группа статусов"
    parameter_name = "status_family"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        """Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            model_admin: Экземпляр ModelAdmin, для которого строится фильтр.
        
        Returns:
            Список типа list[tuple[Any, str]] с данными результата.
        """
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
        """Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
        """
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
    """Класс HasActorFilter настраивает поведение сущности в Django Admin."""
    title = "Есть актёр"
    parameter_name = "has_actor"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        """Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            model_admin: Экземпляр ModelAdmin, для которого строится фильтр.
        
        Returns:
            Список типа list[tuple[Any, str]] с данными результата.
        """
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
        """Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
        """
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
    """Класс HasRequestIdFilter настраивает поведение сущности в Django Admin."""
    title = "Есть request_id"
    parameter_name = "has_request_id"

    def lookups(
        self,
        request: HttpRequest,
        model_admin: admin.ModelAdmin,
    ) -> list[tuple[Any, str]]:
        """Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            model_admin: Экземпляр ModelAdmin, для которого строится фильтр.
        
        Returns:
            Список типа list[tuple[Any, str]] с данными результата.
        """
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
        """Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
        """
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
    """Класс AuditEventAdmin настраивает поведение сущности в Django Admin."""
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
    _EXPORT_CONTROL_PARAMS = {
        "format",
        "export_date",
        "date_from",
        "date_to",
        "selected_only",
        "_selected_action",
    }

    @admin.display(description="Path")
    def short_path(self, obj):
        """Формирует краткое представление path.
        
        Args:
            obj: Параметр obj, используемый в логике функции.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        path_value = obj.path or ""
        return path_value if len(path_value) <= 80 else f"{path_value[:77]}..."

    def has_add_permission(self, request):
        """Проверяет условие add permission и возвращает логический результат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        return False

    def has_change_permission(self, request, obj=None):
        """Проверяет условие change permission и возвращает логический результат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return False

    def has_delete_permission(self, request, obj=None):
        """Проверяет условие delete permission и возвращает логический результат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return False

    @admin.action(description="Экспортировать выбранные (CSV)")
    def export_selected_as_csv(self, _request, queryset):
        """Экспортирует selected as csv в запрошенный формат.
        
        Args:
            _request: HTTP-запрос, не используемый напрямую в теле функции.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        return self._build_export_response(queryset, export_format="csv")

    @admin.action(description="Экспортировать выбранные (JSON)")
    def export_selected_as_json(self, _request, queryset):
        """Экспортирует selected as json в запрошенный формат.
        
        Args:
            _request: HTTP-запрос, не используемый напрямую в теле функции.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        return self._build_export_response(queryset, export_format="json")

    @admin.action(description="Экспортировать выбранные (JSONL)")
    def export_selected_as_jsonl(self, _request, queryset):
        """Экспортирует selected as jsonl в запрошенный формат.
        
        Args:
            _request: HTTP-запрос, не используемый напрямую в теле функции.
            queryset: Набор записей, к которому применяются фильтры.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        return self._build_export_response(queryset, export_format="jsonl")

    def get_urls(self):
        """Возвращает urls из текущего контекста или хранилища.
        
        Returns:
            Функция не возвращает значение.
        """
        urls = super().get_urls()
        custom_urls = [
            path(
                "export/",
                self.admin_site.admin_view(self.export_view),
                name="auditlog_auditevent_export",
            ),
        ]
        return custom_urls + urls

    def changelist_view(
        self,
        request: HttpRequest,
        extra_context: dict[str, Any] | None = None,
    ):
        """Обрабатывает API-представление для changelist.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            extra_context: Параметр extra context, используемый в логике функции.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        context: dict[str, Any] = dict(extra_context or {})
        params = request.GET.copy()
        for param in self._EXPORT_CONTROL_PARAMS:
            params.pop(param, None)
        preserved_items = list(params.lists())
        query_string = params.urlencode()
        export_base = reverse("admin:auditlog_auditevent_export")
        separator = f"?{query_string}&" if query_string else "?"
        context["export_csv_url"] = f"{export_base}{separator}format=csv"
        context["export_json_url"] = f"{export_base}{separator}format=json"
        context["export_jsonl_url"] = f"{export_base}{separator}format=jsonl"
        context["export_url"] = export_base
        context["export_preserved_items"] = preserved_items
        return super().changelist_view(request, extra_context=context)

    def export_view(self, request):
        """Экспортирует view в запрошенный формат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        export_format = (request.GET.get("format") or "csv").strip().lower()
        if export_format not in {"csv", "json", "jsonl"}:
            return HttpResponseBadRequest("Неподдерживаемый формат экспорта".encode("utf-8"))

        try:
            queryset = self._get_filtered_queryset(request)
            queryset = self._apply_export_date_filters(queryset, request)
            queryset = self._apply_export_selected_filters(queryset, request)
        except ValueError as exc:
            return HttpResponseBadRequest(str(exc).encode("utf-8"))
        return self._build_export_response(queryset, export_format=export_format)

    def _get_filtered_queryset(self, request):
        """Возвращает filtered queryset из текущего контекста или хранилища.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        original_get = request.GET
        mutable_get = request.GET.copy()
        for param in self._EXPORT_CONTROL_PARAMS:
            mutable_get.pop(param, None)
        request.GET = mutable_get
        try:
            changelist = self.get_changelist_instance(request)
            return changelist.get_queryset(request)
        finally:
            request.GET = original_get

    @staticmethod
    def _parse_iso_date(value: str | None, *, param: str) -> date | None:
        """Разбирает iso date из входных данных с валидацией формата.
        
        Args:
            value: Входное значение для проверки или преобразования.
            param: Строковый параметр запроса или фильтра выгрузки.
        
        Returns:
            Объект типа date | None, сформированный в рамках обработки.
        """
        normalized = (value or "").strip()
        if not normalized:
            return None
        try:
            return date.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError(
                f"Некорректный параметр '{param}': ожидается дата в формате YYYY-MM-DD"
            ) from exc

    @staticmethod
    def _parse_selected_ids(values: list[str]) -> list[int]:
        """Разбирает selected ids из входных данных с валидацией формата.
        
        Args:
            values: Набор значений, выбранных для фильтрации или экспорта.
        
        Returns:
            Список типа list[int] с результатами операции.
        """
        selected_ids: list[int] = []
        for raw in values:
            normalized = str(raw).strip()
            if not normalized:
                continue
            try:
                event_id = int(normalized)
            except (TypeError, ValueError) as exc:
                raise ValueError("Некорректный идентификатор выбранного аудит-события") from exc
            if event_id < 1:
                raise ValueError("Идентификатор аудит-события должен быть >= 1")
            selected_ids.append(event_id)
        return selected_ids

    @staticmethod
    def _parse_selected_only(value: str | None) -> bool:
        """Разбирает selected only из входных данных с валидацией формата.
        
        Args:
            value: Входное значение для проверки или преобразования.
        
        Returns:
            Логическое значение результата проверки.
        """
        return (value or "").strip().lower() in {"1", "true", "yes", "on"}

    def _apply_export_date_filters(self, queryset, request):
        """Применяет export date filters к целевым данным.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        export_date = self._parse_iso_date(request.GET.get("export_date"), param="export_date")
        date_from = self._parse_iso_date(request.GET.get("date_from"), param="date_from")
        date_to = self._parse_iso_date(request.GET.get("date_to"), param="date_to")
        if date_from is not None and date_to is not None and date_from > date_to:
            raise ValueError("Некорректный диапазон дат: date_from должен быть <= date_to")
        if export_date is not None:
            return queryset.filter(created_at__date=export_date)
        if date_from is not None:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to is not None:
            queryset = queryset.filter(created_at__date__lte=date_to)
        return queryset

    def _apply_export_selected_filters(self, queryset, request):
        """Применяет export selected filters к целевым данным.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        selected_only = self._parse_selected_only(request.GET.get("selected_only"))
        selected_ids = self._parse_selected_ids(request.GET.getlist("_selected_action"))
        if selected_ids:
            return queryset.filter(pk__in=selected_ids)
        if selected_only:
            raise ValueError(
                "Для экспорта только выбранных записей отметьте хотя бы одну строку в чекбоксах"
            )
        return queryset

    def _serialize_event(self, event: AuditEvent) -> dict[str, object]:
        """Сериализует event в формат, пригодный для передачи клиенту.
        
        Args:
            event: Событие для логирования или последующей обработки.
        
        Returns:
            Словарь типа dict[str, object] с результатами операции.
        """
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
        """Формирует export filename для дальнейшего использования в потоке обработки.
        
        Args:
            export_format: Формат выгрузки аудита, например csv или json.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        timestamp = timezone.now().strftime("%Y%m%d-%H%M%S")
        return f"audit-events-{timestamp}.{slugify(export_format) or export_format}"

    def _build_export_response(self, queryset, *, export_format: str) -> HttpResponse:
        """Формирует export response для дальнейшего использования в потоке обработки.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            export_format: Формат выгрузки аудита, например csv или json.
        
        Returns:
            HTTP-ответ с данными результата операции.
        """
        if export_format == "csv":
            return self._as_csv(queryset, filename=self._build_export_filename("csv"))
        if export_format == "json":
            return self._as_json(queryset, filename=self._build_export_filename("json"))
        if export_format == "jsonl":
            return self._as_jsonl(queryset, filename=self._build_export_filename("jsonl"))
        return HttpResponseBadRequest("Неподдерживаемый формат экспорта".encode("utf-8"))

    def _as_csv(self, queryset, *, filename: str) -> HttpResponse:
        """Преобразует данные в представление csv.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            filename: Исходное имя файла, переданного в обработку.
        
        Returns:
            HTTP-ответ с данными результата операции.
        """
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
        """Преобразует данные в представление json.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            filename: Исходное имя файла, переданного в обработку.
        
        Returns:
            HTTP-ответ с данными результата операции.
        """
        payload = [self._serialize_event(event) for event in queryset.iterator(chunk_size=1000)]
        response = HttpResponse(content_type="application/json; charset=utf-8")
        response.write(
            json.dumps(payload, ensure_ascii=False, indent=2, default=self._json_default).encode("utf-8")
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _as_jsonl(self, queryset, *, filename: str) -> HttpResponse:
        """Преобразует данные в представление jsonl.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            filename: Исходное имя файла, переданного в обработку.
        
        Returns:
            HTTP-ответ с данными результата операции.
        """
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
        """Выполняет вспомогательную обработку для json default.
        
        Args:
            value: Входное значение для проверки или преобразования.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)
