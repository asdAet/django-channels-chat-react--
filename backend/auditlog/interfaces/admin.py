import csv
import json
from collections import defaultdict
from datetime import date, datetime
from typing import Any, cast

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from django.db.models import Count, Max, Min, Q, QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest
from django.template.response import TemplateResponse
from django.urls import NoReverseMatch, path, reverse
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
    _IP_SORT_FIELDS = {
        "ip": "ip",
        "first_seen": "first_seen",
        "last_seen": "last_seen",
        "total_events": "total_events",
        "account_count": "account_count",
        "anonymous_events": "anonymous_events",
    }
    _IP_DEFAULT_SORT = ("last_seen", "desc")
    _IP_SUMMARY_PAGE_SIZE = 100

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
            path(
                "ip-summary/",
                self.admin_site.admin_view(self.ip_summary_view),
                name="auditlog_auditevent_ip_summary",
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
        context["ip_summary_url"] = reverse("admin:auditlog_auditevent_ip_summary")
        return super().changelist_view(request, extra_context=context)

    def ip_summary_view(self, request: HttpRequest) -> HttpResponse:
        """Renders a compact audit view grouped by unique IP addresses."""
        base_queryset = self._get_ip_summary_base_queryset()
        try:
            filtered_queryset = self._apply_ip_summary_filters(base_queryset, request)
        except ValueError as exc:
            return HttpResponseBadRequest(str(exc).encode("utf-8"))
        sort_field, direction, order_expression = self._resolve_ip_sort(request)
        grouped_queryset = (
            filtered_queryset.values("ip")
            .annotate(
                total_events=Count("id"),
                first_seen=Min("created_at"),
                last_seen=Max("created_at"),
                account_count=Count("actor_user_id_snapshot", distinct=True),
                anonymous_events=Count("id", filter=Q(actor_user_id_snapshot__isnull=True)),
            )
            .order_by(order_expression, "ip")
        )

        paginator = Paginator(grouped_queryset, self._IP_SUMMARY_PAGE_SIZE)
        page_obj = paginator.get_page(request.GET.get("page"))
        page_items = list(page_obj.object_list)
        page_ips = [str(item["ip"]) for item in page_items if item.get("ip")]
        accounts_by_ip = self._collect_accounts_by_ip(filtered_queryset, page_ips)
        rows = [
            {
                "ip": item["ip"],
                "total_events": item["total_events"],
                "first_seen": item["first_seen"],
                "last_seen": item["last_seen"],
                "account_count": item["account_count"],
                "anonymous_events": item["anonymous_events"],
                "accounts": accounts_by_ip.get(str(item["ip"]), []),
            }
            for item in page_items
        ]

        sort_links = {
            field: self._build_ip_summary_sort_url(request, field, sort_field, direction)
            for field in self._IP_SORT_FIELDS
        }
        context = {
            **self.admin_site.each_context(request),
            "title": "Аудит по IP",
            "opts": self.model._meta,
            "has_view_permission": self.has_view_permission(request),
            "ip_rows": rows,
            "page_obj": page_obj,
            "sort_field": sort_field,
            "sort_direction": direction,
            "sort_links": sort_links,
            "ip_filter": (request.GET.get("ip") or "").strip(),
            "actor_filter": (request.GET.get("actor") or "").strip(),
            "date_from": (request.GET.get("date_from") or "").strip(),
            "date_to": (request.GET.get("date_to") or "").strip(),
            "query_without_page": self._build_query_string(request, {"page": None}),
            "audit_changelist_url": reverse("admin:auditlog_auditevent_changelist"),
        }
        return TemplateResponse(
            request,
            "admin/auditlog/auditevent/ip_summary.html",
            context=context,
        )

    def _get_ip_summary_base_queryset(self) -> QuerySet[AuditEvent]:
        """Returns audit events with a non-empty IP address."""
        return AuditEvent.objects.exclude(Q(ip__isnull=True) | Q(ip__exact=""))

    def _apply_ip_summary_filters(
        self,
        queryset: QuerySet[AuditEvent],
        request: HttpRequest,
    ) -> QuerySet[AuditEvent]:
        """Applies optional filters for IP summary view."""
        filtered_queryset = queryset
        ip_filter = (request.GET.get("ip") or "").strip()
        if ip_filter:
            filtered_queryset = filtered_queryset.filter(ip__icontains=ip_filter)

        actor_filter = (request.GET.get("actor") or "").strip()
        if actor_filter:
            actor_match = Q(actor_username_snapshot__icontains=actor_filter)
            if actor_filter.isdigit():
                actor_match |= Q(actor_user_id_snapshot=int(actor_filter))
            filtered_queryset = filtered_queryset.filter(actor_match)

        date_from = self._parse_iso_date(request.GET.get("date_from"), param="date_from")
        date_to = self._parse_iso_date(request.GET.get("date_to"), param="date_to")
        if date_from is not None and date_to is not None and date_from > date_to:
            raise ValueError("Некорректный диапазон дат: date_from должен быть <= date_to")
        if date_from is not None:
            filtered_queryset = filtered_queryset.filter(created_at__date__gte=date_from)
        if date_to is not None:
            filtered_queryset = filtered_queryset.filter(created_at__date__lte=date_to)
        return filtered_queryset

    def _resolve_ip_sort(self, request: HttpRequest) -> tuple[str, str, str]:
        """Normalizes sorting arguments for the IP summary table."""
        sort_field = (request.GET.get("sort") or "").strip().lower()
        if sort_field not in self._IP_SORT_FIELDS:
            sort_field = self._IP_DEFAULT_SORT[0]
        direction = (request.GET.get("direction") or "").strip().lower()
        if direction not in {"asc", "desc"}:
            direction = self._IP_DEFAULT_SORT[1]
        field_expression = self._IP_SORT_FIELDS[sort_field]
        order_expression = field_expression if direction == "asc" else f"-{field_expression}"
        return sort_field, direction, order_expression

    def _build_ip_summary_sort_url(
        self,
        request: HttpRequest,
        target_field: str,
        current_field: str,
        current_direction: str,
    ) -> str:
        """Builds a URL that toggles sorting for a specific column."""
        next_direction = "asc"
        if current_field != target_field:
            default_field, default_direction = self._IP_DEFAULT_SORT
            if target_field == default_field:
                next_direction = default_direction
        elif current_direction == "asc":
            next_direction = "desc"
        return self._build_query_string(
            request,
            {
                "sort": target_field,
                "direction": next_direction,
                "page": None,
            },
        )

    @staticmethod
    def _build_query_string(request: HttpRequest, changes: dict[str, str | None]) -> str:
        """Returns query string with updated parameters."""
        params = request.GET.copy()
        for key, value in changes.items():
            if value is None:
                params.pop(key, None)
                continue
            params[key] = value
        encoded = params.urlencode()
        return f"?{encoded}" if encoded else ""

    def _collect_accounts_by_ip(
        self,
        queryset: QuerySet[AuditEvent],
        ips: list[str],
    ) -> dict[str, list[dict[str, str | int | None]]]:
        """Collects account snapshots for each IP on current page."""
        if not ips:
            return {}
        account_rows = (
            queryset.filter(ip__in=ips)
            .values("ip", "actor_user_id_snapshot", "actor_username_snapshot")
            .exclude(
                Q(actor_user_id_snapshot__isnull=True)
                & (Q(actor_username_snapshot__isnull=True) | Q(actor_username_snapshot__exact=""))
            )
            .distinct()
        )
        grouped_raw: dict[str, set[tuple[int | None, str]]] = defaultdict(set)
        user_ids: set[int] = set()
        for row in account_rows:
            ip_value = str(row["ip"])
            user_id = cast(int | None, row["actor_user_id_snapshot"])
            username = str(row["actor_username_snapshot"] or "").strip()
            grouped_raw[ip_value].add((user_id, username))
            if user_id is not None:
                user_ids.add(user_id)

        user_model = get_user_model()
        existing_users = user_model._default_manager.filter(pk__in=user_ids)
        users_by_id: dict[int, Any] = {int(user.pk): user for user in existing_users}
        grouped: dict[str, list[dict[str, str | int | None]]] = {}

        for ip_value, account_keys in grouped_raw.items():
            account_items: list[dict[str, str | int | None]] = []
            sorted_keys = sorted(
                account_keys,
                key=lambda item: (
                    item[0] is None,
                    item[0] if item[0] is not None else 0,
                    item[1].lower(),
                ),
            )
            for user_id, username_snapshot in sorted_keys:
                resolved_username = username_snapshot
                admin_url: str | None = None
                if user_id is not None:
                    user_obj = users_by_id.get(user_id)
                    if user_obj is not None:
                        resolved_username = str(getattr(user_obj, user_model.USERNAME_FIELD, resolved_username))
                        try:
                            admin_url = reverse(
                                f"admin:{user_model._meta.app_label}_{user_model._meta.model_name}_change",
                                args=[user_id],
                            )
                        except NoReverseMatch:
                            admin_url = None
                    elif not resolved_username:
                        resolved_username = f"ID {user_id}"
                elif not resolved_username:
                    resolved_username = "Неизвестный пользователь"
                account_items.append(
                    {
                        "user_id": user_id,
                        "username": resolved_username,
                        "admin_url": admin_url,
                    }
                )
            grouped[ip_value] = account_items
        return grouped

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
