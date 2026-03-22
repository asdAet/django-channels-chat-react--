# Backend Reference

Generated: 2026-03-22T02:06:48Z

Total modules: 184

## `backend/auditlog/__init__.py`

- Description: Auditlog app.
- Functions: 0
- Classes: 0

## `backend/auditlog/admin.py`

- Functions: 0
- Classes: 0

## `backend/auditlog/application/__init__.py`

- Description: Application layer for audit logging.
- Functions: 0
- Classes: 0

## `backend/auditlog/application/query_service.py`

- Functions: 7
- Classes: 0

### Functions

- `_parse_int(raw_value, *, field_name: str) -> int | None`
  - Разбирает int из входных данных с валидацией формата. Args: raw_value: Исходное значение параметра до преобразования и валидации. field_name: Имя поля модели, которое содержит путь к файлу. Returns: Объект типа int | None, сформированный в рамках обработки.
- `_parse_bool(raw_value, *, field_name: str) -> bool | None`
  - Разбирает bool из входных данных с валидацией формата. Args: raw_value: Исходное значение параметра до преобразования и валидации. field_name: Имя поля модели, которое содержит путь к файлу. Returns: Объект типа bool | None, сформированный в рамках обработки.
- `_parse_datetime(raw_value, *, field_name: str) -> datetime | None`
  - Разбирает datetime из входных данных с валидацией формата. Args: raw_value: Исходное значение параметра до преобразования и валидации. field_name: Имя поля модели, которое содержит путь к файлу. Returns: Объект типа datetime | None, сформированный в рамках обработки.
- `parse_filters(params) -> AuditQueryFilters`
  - Разбирает filters из входных данных с валидацией формата. Args: params: Данные params, участвующие в обработке текущей операции. Returns: Объект типа AuditQueryFilters, сформированный в рамках обработки.
- `list_events(filters: AuditQueryFilters)`
  - Возвращает список events, доступных в текущем контексте. Args: filters: Набор фильтров, применяемых к выборке событий или данных. Returns: Функция не возвращает значение.
- `get_event(event_id: int)`
  - Возвращает event из текущего контекста или хранилища. Args: event_id: Идентификатор event, используемый для выборки данных. Returns: Функция не возвращает значение.
- `list_action_counts(filters: AuditQueryFilters)`
  - Возвращает список action counts, доступных в текущем контексте. Args: filters: Набор фильтров, применяемых к выборке событий или данных. Returns: Функция не возвращает значение.

## `backend/auditlog/application/username_history_service.py`

- Functions: 1
- Classes: 0

### Functions

- `get_username_history(user_id: int, *, limit: int=200)`
  - Возвращает username history из текущего контекста или хранилища. Args: user_id: Идентификатор user, используемый для выборки данных. limit: Данные limit, участвующие в обработке текущей операции. Returns: Функция не возвращает значение.

## `backend/auditlog/application/write_service.py`

- Functions: 14
- Classes: 0

### Functions

- `_normalize_int(value)`
  - Нормализует int к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Функция не возвращает значение.
- `_scope_header(scope, name: bytes) -> str | None`
  - Выполняет вспомогательную обработку для scope header. Args: scope: ASGI-scope с метаданными соединения. name: Человекочитаемое имя объекта или параметра. Returns: Объект типа str | None, полученный при выполнении операции.
- `_get_or_create_request_id_for_request(request) -> str`
  - Возвращает or create request id for request из текущего контекста или хранилища. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Строковое значение, сформированное функцией.
- `_get_or_create_request_id_for_scope(scope) -> str`
  - Возвращает or create request id for scope из текущего контекста или хранилища. Args: scope: ASGI-scope с метаданными соединения. Returns: Строковое значение, сформированное функцией.
- `_extract_actor(actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None)`
  - Извлекает actor из источника данных. Args: actor_user: Пользователь, от имени которого пишется аудит-событие. actor_user_id: Идентификатор пользователя, от имени которого пишется аудит. actor_username: Публичное имя пользователя для аудита и ответа API. is_authenticated: Булев флаг условия authenticated. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_safe_metadata(metadata) -> dict`
  - Вспомогательная функция `_safe_metadata` реализует внутренний шаг бизнес-логики. Args: metadata: Дополнительные поля события, включаемые в аудит-запись. Returns: Словарь типа dict с данными результата.
- `_default_success(event: str, status_code: int | None) -> bool`
  - Вспомогательная функция `_default_success` реализует внутренний шаг бизнес-логики. Args: event: Событие для логирования или трансляции. status_code: HTTP-код результата операции. Returns: Логическое значение результата проверки.
- `_persist_event_row(payload: dict) -> None`
  - Сохраняет event row в постоянном хранилище. Args: payload: Подготовленные данные для сохранения или отправки.
- `_persist_event(payload: dict) -> None`
  - Сохраняет event в постоянном хранилище. Args: payload: Подготовленные данные для сохранения или отправки.
- `write_event(action: str, *, protocol=None, method=None, path=None, status_code=None, success=None, ip=None, request_id=None, actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None, metadata=None, **fields)`
  - Записывает event в хранилище или аудит. Args: action: Код или имя действия, которое фиксируется в аудите. protocol: Транспортный протокол текущего запроса или события. method: HTTP-метод текущего запроса. path: Путь ресурса в storage или URL-маршруте. status_code: HTTP-код результата операции. success: Флаг успешного выполнения операции. ip: IP-адрес клиента. request_id: Идентификатор request. actor_user: Пользователь, от имени которого пишется аудит-событие. actor_user_id: Идентификатор пользователя, от имени которого пишется аудит. actor_username: Публичное имя пользователя для аудита и ответа API. is_authenticated: Булев флаг условия authenticated. metadata: Дополнительные поля события, включаемые в аудит-запись. **fields: Дополнительные поля, переданные в функцию.
- `audit_security_event(event: str, **fields) -> None`
  - Фиксирует security event в системе аудита. Args: event: Событие для логирования или трансляции. **fields: Дополнительные поля, переданные в функцию.
- `audit_http_event(event: str, request, **fields) -> None`
  - Фиксирует http event в системе аудита. Args: event: Событие для логирования или трансляции. request: HTTP-запрос с контекстом пользователя и входными данными. **fields: Дополнительные поля, переданные в функцию.
- `audit_ws_event(event: str, scope, **fields) -> None`
  - Фиксирует ws event в системе аудита. Args: event: Событие для логирования или трансляции. scope: ASGI-контекст соединения с метаданными клиента. **fields: Дополнительные поля, переданные в функцию.
- `audit_http_request(request, response=None, exception: Exception | None=None) -> None`
  - Фиксирует http request в системе аудита. Args: request: HTTP-запрос с контекстом пользователя и входными данными. response: HTTP-ответ, который анализируется перед возвратом клиенту. exception: Параметр exception, используемый в логике функции.

## `backend/auditlog/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditlogConfig` : `AppConfig`
  - Класс AuditlogConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/auditlog/domain/__init__.py`

- Description: Domain contracts for audit logging.
- Functions: 0
- Classes: 0

## `backend/auditlog/domain/actions.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditAction`
  - Класс AuditAction инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/auditlog/domain/context.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditQueryFilters`
  - Класс AuditQueryFilters инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/auditlog/domain/sanitize.py`

- Functions: 1
- Classes: 0

### Functions

- `sanitize_value(value)`
  - Санитизирует значение. Args: value: Значение, которое нужно нормализовать или проверить. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/auditlog/infrastructure/__init__.py`

- Description: Infrastructure layer for audit logging.
- Functions: 0
- Classes: 0

## `backend/auditlog/infrastructure/cursor.py`

- Functions: 2
- Classes: 0

### Functions

- `encode_cursor(created_at: datetime, event_id: int) -> str`
  - Кодирует cursor в формат хранения или передачи. Args: created_at: Дата и время создания записи для курсорной пагинации. event_id: Идентификатор event, используемый для выборки данных. Returns: Строковое значение, сформированное функцией.
- `decode_cursor(value: str | None) -> tuple[datetime, int] | None`
  - Декодирует cursor из внешнего представления. Args: value: Входное значение для проверки или преобразования. Returns: Кортеж типа tuple[datetime, int] | None с результатами операции.

## `backend/auditlog/infrastructure/models.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditEvent` : `models.Model`
  - Модель AuditEvent описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/auditlog/infrastructure/query_builder.py`

- Functions: 1
- Classes: 0

### Functions

- `apply_filters(queryset: QuerySet[AuditEvent], filters: AuditQueryFilters, *, include_action_filters: bool=True) -> QuerySet[AuditEvent]`
  - Применяет filters к текущему набору данных. Args: queryset: Набор записей, к которому применяются фильтры. filters: Параметр filters, используемый в логике функции. include_action_filters: Параметр include action filters, используемый в логике функции. Returns: Объект типа QuerySet[AuditEvent], сформированный в ходе выполнения.

## `backend/auditlog/infrastructure/repository.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditEventRepository`
  - Класс AuditEventRepository инкапсулирует связанную бизнес-логику модуля.
  - Methods: 2
  - `create(**kwargs) -> AuditEvent`
    - Создает данные. Args: **kwargs: Дополнительные именованные аргументы вызова. Returns: Объект типа AuditEvent, сформированный в ходе выполнения.
  - `all() -> QuerySet[AuditEvent]`
    - Вспомогательная функция `all` реализует внутренний шаг бизнес-логики. Returns: Объект типа QuerySet[AuditEvent], сформированный в ходе выполнения.

## `backend/auditlog/interfaces/__init__.py`

- Description: Interfaces for auditlog app.
- Functions: 0
- Classes: 0

## `backend/auditlog/interfaces/admin.py`

- Functions: 0
- Classes: 4

### Classes

- `StatusFamilyFilter` : `admin.SimpleListFilter`
  - Класс StatusFamilyFilter настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
    - Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. model_admin: Экземпляр ModelAdmin, для которого строится фильтр. Returns: Список типа list[tuple[Any, str]] с данными результата.
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
    - Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. queryset: Набор записей, к которому применяются фильтры. Returns: Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
- `HasActorFilter` : `admin.SimpleListFilter`
  - Класс HasActorFilter настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
    - Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. model_admin: Экземпляр ModelAdmin, для которого строится фильтр. Returns: Список типа list[tuple[Any, str]] с данными результата.
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
    - Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. queryset: Набор записей, к которому применяются фильтры. Returns: Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
- `HasRequestIdFilter` : `admin.SimpleListFilter`
  - Класс HasRequestIdFilter настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
    - Вспомогательная функция `lookups` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. model_admin: Экземпляр ModelAdmin, для которого строится фильтр. Returns: Список типа list[tuple[Any, str]] с данными результата.
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
    - Вспомогательная функция `queryset` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. queryset: Набор записей, к которому применяются фильтры. Returns: Объект типа QuerySet[Any] | None, сформированный в ходе выполнения.
- `AuditEventAdmin` : `admin.ModelAdmin`
  - Класс AuditEventAdmin настраивает поведение сущности в Django Admin.
  - Methods: 30
  - `short_path(self, obj)`
    - Формирует краткое представление path. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `has_add_permission(self, request)`
    - Проверяет условие add permission и возвращает логический результат. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
  - `has_change_permission(self, request, obj=None)`
    - Проверяет условие change permission и возвращает логический результат. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `has_delete_permission(self, request, obj=None)`
    - Проверяет условие delete permission и возвращает логический результат. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `export_selected_as_csv(self, _request, queryset)`
    - Экспортирует selected as csv в запрошенный формат. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. queryset: Набор записей, к которому применяются фильтры. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `export_selected_as_json(self, _request, queryset)`
    - Экспортирует selected as json в запрошенный формат. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. queryset: Набор записей, к которому применяются фильтры. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `export_selected_as_jsonl(self, _request, queryset)`
    - Экспортирует selected as jsonl в запрошенный формат. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. queryset: Набор записей, к которому применяются фильтры. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `get_urls(self)`
    - Возвращает urls из текущего контекста или хранилища. Returns: Функция не возвращает значение.
  - `changelist_view(self, request: HttpRequest, extra_context: dict[str, Any] | None=None)`
    - Обрабатывает API-представление для changelist. Args: request: HTTP-запрос с контекстом пользователя и входными данными. extra_context: Параметр extra context, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `ip_summary_view(self, request: HttpRequest) -> HttpResponse`
    - Renders a compact audit view grouped by unique IP addresses.
  - `_get_ip_summary_base_queryset(self) -> QuerySet[AuditEvent]`
    - Returns audit events with a non-empty IP address.
  - `_apply_ip_summary_filters(self, queryset: QuerySet[AuditEvent], request: HttpRequest) -> QuerySet[AuditEvent]`
    - Applies optional filters for IP summary view.
  - `_resolve_ip_sort(self, request: HttpRequest) -> tuple[str, str, str]`
    - Normalizes sorting arguments for the IP summary table.
  - `_build_ip_summary_sort_url(self, request: HttpRequest, target_field: str, current_field: str, current_direction: str) -> str`
    - Builds a URL that toggles sorting for a specific column.
  - `_build_query_string(request: HttpRequest, changes: dict[str, str | None]) -> str`
    - Returns query string with updated parameters.
  - `_collect_accounts_by_ip(self, queryset: QuerySet[AuditEvent], ips: list[str]) -> dict[str, list[dict[str, str | int | None]]]`
    - Collects account snapshots for each IP on current page.
  - `export_view(self, request)`
    - Экспортирует view в запрошенный формат. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `_get_filtered_queryset(self, request)`
    - Возвращает filtered queryset из текущего контекста или хранилища. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
  - `_parse_iso_date(value: str | None, *, param: str) -> date | None`
    - Разбирает iso date из входных данных с валидацией формата. Args: value: Входное значение для проверки или преобразования. param: Строковый параметр запроса или фильтра выгрузки. Returns: Объект типа date | None, сформированный в рамках обработки.
  - `_parse_selected_ids(values: list[str]) -> list[int]`
    - Разбирает selected ids из входных данных с валидацией формата. Args: values: Набор значений, выбранных для фильтрации или экспорта. Returns: Список типа list[int] с результатами операции.
  - `_parse_selected_only(value: str | None) -> bool`
    - Разбирает selected only из входных данных с валидацией формата. Args: value: Входное значение для проверки или преобразования. Returns: Логическое значение результата проверки.
  - `_apply_export_date_filters(self, queryset, request)`
    - Применяет export date filters к целевым данным. Args: queryset: Набор записей, к которому применяются фильтры. request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `_apply_export_selected_filters(self, queryset, request)`
    - Применяет export selected filters к целевым данным. Args: queryset: Набор записей, к которому применяются фильтры. request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `_serialize_event(self, event: AuditEvent) -> dict[str, object]`
    - Сериализует event в формат, пригодный для передачи клиенту. Args: event: Событие для логирования или последующей обработки. Returns: Словарь типа dict[str, object] с результатами операции.
  - `_build_export_filename(self, export_format: str) -> str`
    - Формирует export filename для дальнейшего использования в потоке обработки. Args: export_format: Формат выгрузки аудита, например csv или json. Returns: Строковое значение, сформированное функцией.
  - `_build_export_response(self, queryset, *, export_format: str) -> HttpResponse`
    - Формирует export response для дальнейшего использования в потоке обработки. Args: queryset: Набор записей, к которому применяются фильтры. export_format: Формат выгрузки аудита, например csv или json. Returns: HTTP-ответ с данными результата операции.
  - `_as_csv(self, queryset, *, filename: str) -> HttpResponse`
    - Преобразует данные в представление csv. Args: queryset: Набор записей, к которому применяются фильтры. filename: Исходное имя файла, переданного в обработку. Returns: HTTP-ответ с данными результата операции.
  - `_as_json(self, queryset, *, filename: str) -> HttpResponse`
    - Преобразует данные в представление json. Args: queryset: Набор записей, к которому применяются фильтры. filename: Исходное имя файла, переданного в обработку. Returns: HTTP-ответ с данными результата операции.
  - `_as_jsonl(self, queryset, *, filename: str) -> HttpResponse`
    - Преобразует данные в представление jsonl. Args: queryset: Набор записей, к которому применяются фильтры. filename: Исходное имя файла, переданного в обработку. Returns: HTTP-ответ с данными результата операции.
  - `_json_default(value)`
    - Выполняет вспомогательную обработку для json default. Args: value: Входное значение для проверки или преобразования. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/auditlog/interfaces/api.py`

- Functions: 4
- Classes: 0

### Functions

- `events_list_view(request)`
  - Обрабатывает API-представление для events list. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `event_detail_view(_request, event_id: int)`
  - Обрабатывает API-представление для event detail. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. event_id: Идентификатор event. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `actions_view(request)`
  - Обрабатывает API-представление для actions. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `username_history_view(request, user_id: int)`
  - Обрабатывает API-представление для username history. Args: request: HTTP-запрос с контекстом пользователя и входными данными. user_id: Идентификатор user. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/auditlog/interfaces/middleware.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditHttpMiddleware`
  - Класс AuditHttpMiddleware инкапсулирует связанную бизнес-логику модуля.
  - Methods: 3
  - `__init__(self, get_response)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: get_response: Следующий middleware-обработчик в цепочке Django.
  - `_should_skip(self, request) -> bool`
    - Определяет, нужно ли выполнять действие skip. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Логическое значение результата проверки.
  - `__call__(self, request)`
    - Выполняет объект как вызываемый обработчик. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/auditlog/interfaces/permissions.py`

- Functions: 0
- Classes: 1

### Classes

- `IsStaffAuditReader` : `BasePermission`
  - Класс IsStaffAuditReader инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `has_permission(self, request: Any, view: Any)`
    - Проверяет условие permission и возвращает логический результат. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. view: Экземпляр представления, для которого проверяется разрешение. Returns: Функция не возвращает значение.

## `backend/auditlog/interfaces/serializers.py`

- Functions: 0
- Classes: 2

### Classes

- `AuditEventSerializer` : `serializers.ModelSerializer`
  - Класс AuditEventSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_actor(self, obj)`
    - Возвращает actor из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
- `UsernameHistorySerializer` : `serializers.Serializer`
  - Класс UsernameHistorySerializer сериализует и валидирует данные API.
  - Methods: 0

## `backend/auditlog/interfaces/urls.py`

- Functions: 0
- Classes: 0

## `backend/auditlog/management/__init__.py`

- Description: Management package for auditlog.
- Functions: 0
- Classes: 0

## `backend/auditlog/management/commands/__init__.py`

- Description: Management commands for auditlog.
- Functions: 0
- Classes: 0

## `backend/auditlog/management/commands/cleanup_audit_events.py`

- Functions: 0
- Classes: 1

### Classes

- `Command` : `BaseCommand`
  - Класс Command реализует management-команду Django.
  - Methods: 2
  - `add_arguments(self, parser)`
    - Добавляет arguments в целевую коллекцию. Args: parser: Парсер аргументов management-команды.
  - `handle(self, *args, **options)`
    - Обрабатывает данные. Args: *args: Дополнительные позиционные аргументы вызова. **options: Опции, переданные в management-команду.

## `backend/auditlog/models.py`

- Functions: 0
- Classes: 0

## `backend/auditlog/tests/__init__.py`

- Functions: 0
- Classes: 0

## `backend/auditlog/tests/test_admin_export.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditAdminExportTests` : `TestCase`
  - Methods: 11
  - `setUp(self)`
  - `test_staff_can_export_filtered_json(self)`
  - `test_staff_can_export_csv_by_status_family_filter(self)`
  - `test_staff_can_export_by_exact_date(self)`
  - `test_staff_can_export_by_date_range(self)`
  - `test_staff_can_export_only_selected_checkboxes(self)`
  - `test_selected_only_without_selection_returns_400(self)`
  - `test_invalid_export_date_returns_400(self)`
  - `test_invalid_date_range_returns_400(self)`
  - `test_invalid_selected_event_id_returns_400(self)`
  - `test_non_staff_cannot_export(self)`

## `backend/auditlog/tests/test_admin_ip_summary.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditAdminIpSummaryTests` : `TestCase`
  - Methods: 5
  - `setUp(self)`
  - `test_staff_can_view_ip_summary(self)`
  - `test_ip_rows_are_unique_and_include_related_accounts(self)`
  - `test_staff_can_sort_and_filter_ip_summary(self)`
  - `test_non_staff_cannot_view_ip_summary(self)`

## `backend/auditlog/tests/test_api.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditApiTests` : `TestCase`
  - Methods: 10
  - `setUp(self)`
  - `test_events_endpoint_requires_staff(self)`
  - `test_events_filters_by_user_and_action_prefix(self)`
  - `test_actions_endpoint_returns_counts(self)`
  - `test_username_history_endpoint(self)`
  - `test_events_endpoint_returns_400_for_invalid_filters(self)`
  - `test_event_detail_returns_404_when_missing(self)`
  - `test_event_detail_returns_item_when_present(self)`
  - `test_actions_endpoint_returns_400_for_invalid_filters(self)`
  - `test_username_history_rejects_invalid_limit(self)`

## `backend/auditlog/tests/test_middleware.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditMiddlewareTests` : `TestCase`
  - Methods: 4
  - `test_request_is_saved_to_audit_events(self)`
  - `test_health_endpoints_are_skipped(self)`
  - `test_static_endpoints_are_skipped(self)`
  - `test_middleware_audits_and_reraises_exceptions(self)`

## `backend/auditlog/tests/test_query_components.py`

- Description: Unit tests for audit query parsing/building helpers.
- Functions: 0
- Classes: 2

### Classes

- `AuditCursorTests` : `TestCase`
  - Methods: 2
  - `test_encode_decode_roundtrip(self)`
  - `test_decode_cursor_handles_invalid_and_naive_payloads(self)`
- `AuditQueryComponentsTests` : `TestCase`
  - Methods: 5
  - `setUp(self)`
  - `test_parse_filters_parses_all_fields_and_caps_limit(self)`
  - `test_parse_filters_rejects_invalid_values(self)`
  - `test_apply_filters_and_cursor(self)`
  - `test_list_events_get_event_and_action_counts(self)`

## `backend/auditlog/tests/test_services.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditSignalsAndCleanupTests` : `TestCase`
  - Methods: 2
  - `test_username_change_creates_audit_event(self)`
  - `test_cleanup_command_deletes_old_events(self)`

## `backend/auditlog/tests/test_user_actions_audit.py`

- Description: Integration checks for user action audit coverage.
- Functions: 0
- Classes: 1

### Classes

- `UserActionsAuditCoverageTests` : `TestCase`
  - Methods: 5
  - `setUp(self)`
  - `_csrf(self) -> str`
  - `test_register_profile_and_presence_actions_are_audited(self)`
  - `test_login_failed_and_success_actions_are_audited(self)`
  - `test_chat_resolve_direct_action_is_audited_for_actor(self)`

## `backend/auditlog/tests/test_write_service_extra.py`

- Description: Additional branch coverage for auditlog.application.write_service.
- Functions: 0
- Classes: 1

### Classes

- `AuditWriteServiceExtraTests` : `TestCase`
  - Methods: 8
  - `setUp(self)`
  - `test_normalize_scope_and_request_id_helpers(self)`
  - `test_extract_actor_and_safe_metadata_branches(self)`
  - `test_persist_event_row_handles_db_errors(self)`
  - `test_persist_event_uses_async_loop_when_available(self)`
  - `test_write_event_logs_and_persists_payload(self)`
  - `test_audit_http_and_ws_helpers_forward_to_write_event(self)`
  - `test_audit_http_request_collects_query_and_exception(self)`

## `backend/chat/__init__.py`

- Description: Инициализирует пакет `chat`.
- Functions: 0
- Classes: 0

## `backend/chat/admin.py`

- Description: Admin registrations moved to rooms.admin, roles.admin, messages.admin.
- Functions: 0
- Classes: 0

## `backend/chat/api.py`

- Description: API endpoints for the chat subsystem.
- Functions: 32
- Classes: 2

### Functions

- `_build_profile_pic_url(request, profile_pic)`
  - Формирует profile pic url для дальнейшего использования. Args: request: HTTP-запрос с контекстом пользователя и входными данными. profile_pic: Параметр profile pic, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_build_attachment_url(request, attachment_file, room_id: int | None)`
  - Формирует attachment url для дальнейшего использования. Args: request: HTTP-запрос с контекстом пользователя и входными данными. attachment_file: Параметр attachment file, используемый в логике функции. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_serialize_peer(request, user, *, is_blocked: bool=False)`
  - Сериализует peer для передачи клиенту. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. user: Пользователь, для которого выполняется операция. is_blocked: Булев флаг условия blocked. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_serialize_reply_to(message: Message | None)`
  - Сериализует reply to для передачи клиенту. Args: message: Сообщение, участвующее в обработке. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_serialize_attachment_item(request, attachment: MessageAttachment, *, room_id: int | None)`
  - Сериализует attachment item для ответа API. Args: request: HTTP-запрос с контекстом пользователя и входными данными. attachment: Параметр attachment, используемый в логике функции. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_serialize_group_avatar_for_room(request, room: Room) -> tuple[str | None, dict[str, float] | None]`
  - Сериализует group avatar for room для передачи клиенту. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room: Комната, в контексте которой выполняется действие. Returns: Кортеж типа tuple[str | None, dict[str, float] | None] с результатами операции.
- `_public_room()`
  - Выполняет вспомогательную обработку для public room. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_resolve_chat_target(request, target_ref: str)`
  - Resolve a prefixless chat target into a readable room.
- `_serialize_chat_resolve_response(request, target_kind: str, room: Room)`
  - ????????? ?????? payload resolver-??????.
- `_parse_positive_int(raw_value: str | None, param_name: str) -> int`
  - Разбирает и валидирует positive int. Args: raw_value: Параметр raw value, используемый в логике функции. param_name: Параметр param name, используемый в логике функции. Returns: Целочисленный результат вычисления.
- `_is_transient_db_lock(exc: OperationalError) -> bool`
  - Проверяет условие transient db lock и возвращает булев результат. Args: exc: Параметр exc, используемый в логике функции. Returns: Логическое значение результата проверки.
- `_ensure_direct_memberships_with_retry(room: Room, initiator, peer) -> None`
  - Проверяет обязательные условия для direct memberships with retry. Args: room: Комната, в контексте которой выполняется операция. initiator: Параметр initiator, используемый в логике функции. peer: Параметр peer, используемый в логике функции.
- `_resolve_room(room_id: int)`
  - Определяет room на основе доступного контекста. Args: room_id: Идентификатор room. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_serialize_room_details(request, room: Room, created: bool)`
  - Сериализует room details для передачи клиенту. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room: Комната, в контексте которой выполняется действие. created: Флаг создания новой записи. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `direct_chats(request)`
  - Возвращает список direct-чатов пользователя. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `room_details(request, room_id: int)`
  - Возвращает подробные данные комнаты. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `room_messages(request, room_id: int)`
  - Возвращает сообщения комнаты с учетом пагинации и доступа. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_broadcast_to_room(room: Room, event: dict)`
  - Выполняет вспомогательную обработку для broadcast to room. Args: room: Комната, в контексте которой выполняется действие. event: Событие для логирования или трансляции.
- `_ensure_room_read_access(request, room: Room)`
  - Гарантирует корректность room read access перед выполнением операции. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room: Комната, в контексте которой выполняется действие.
- `_serialize_reader(request, user, *, read_at)`
  - Сериализует reader payload для ответа API.
- `message_detail(request, room_id: int, message_id)`
  - Обрабатывает операции над конкретным сообщением. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. message_id: Идентификатор сообщения. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `message_readers(request, room_id: int, message_id: int)`
  - Возвращает readers конкретного сообщения для его автора.
- `message_reactions(request, room_id: int, message_id)`
  - Добавляет или возвращает реакции сообщения. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. message_id: Идентификатор сообщения. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `message_reaction_remove(request, room_id: int, message_id, emoji)`
  - Удаляет реакцию пользователя с сообщения. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. message_id: Идентификатор сообщения. emoji: Эмодзи-реакция, над которой выполняется операция. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `upload_attachments(request, room_id: int)`
  - Загружает вложения сообщения и возвращает их метаданные. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `search_messages(request, room_id: int)`
  - Ищет сообщения в рамках доступного контекста. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_parse_section_limit(request, key: str, default: int, max_value: int) -> int`
  - Разбирает и валидирует section limit. Args: request: HTTP-запрос с контекстом пользователя и входными данными. key: Параметр key, используемый в логике функции. default: Значение по умолчанию при отсутствии пользовательского ввода. max_value: Параметр max value, используемый в логике функции. Returns: Целочисленный результат вычисления.
- `_interaction_room_ids(user) -> set[int]`
  - Выполняет вспомогательную обработку для interaction room ids. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа set[int], полученный при выполнении операции.
- `_interaction_user_ids(user, room_ids: set[int]) -> set[int]`
  - Выполняет вспомогательную обработку для interaction user ids. Args: user: Пользователь, для которого выполняется операция. room_ids: Список идентификаторов room. Returns: Объект типа set[int], полученный при выполнении операции.
- `global_search(request)`
  - Выполняет глобальный поиск по поддерживаемым сущностям. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `mark_read_view(request, room_id: int)`
  - Помечает read view новым состоянием. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `unread_counts(request)`
  - Возвращает счетчики непрочитанных сообщений по комнатам. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.

### Classes

- `ChatResolveInputSerializer` : `serializers.Serializer`
  - ??????????? ??????? ?????? ??? ?????????????? chat resolver.
  - Methods: 0
- `ChatResolveApiView` : `GenericAPIView`
  - Resolve a prefixless chat target into room metadata.
  - Methods: 2
  - `get(self, _request)`
  - `post(self, request)`

## `backend/chat/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `ChatConfig` : `AppConfig`
  - Класс ChatConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/chat/constants.py`

- Description: Chat subsystem constants and backward-compatible re-exports.
- Functions: 0
- Classes: 0

## `backend/chat/consumers.py`

- Description: WebSocket consumer для комнатного чата.
- Functions: 1
- Classes: 1

### Functions

- `_ws_connect_rate_limited(scope, endpoint: str) -> bool`
  - Выполняет вспомогательную обработку для ws connect rate limited. Args: scope: ASGI-scope с метаданными соединения. endpoint: Идентификатор API/WS endpoint для применения правил. Returns: Логическое значение результата проверки.

### Classes

- `ChatConsumer` : `AsyncWebsocketConsumer`
  - Класс ChatConsumer обрабатывает WebSocket-события и сообщения.
  - Methods: 30
  - `connect(self)`
    - Устанавливает соединение и выполняет проверки доступа.
  - `disconnect(self, code)`
    - Корректно закрывает соединение и освобождает ресурсы. Args: code: Код ошибки или состояния.
  - `receive(self, text_data=None, bytes_data=None)`
    - Принимает входящее сообщение и маршрутизирует его обработку. Args: text_data: Параметр text data, используемый в логике функции. bytes_data: Параметр bytes data, используемый в логике функции.
  - `chat_message(self, event)`
    - Транслирует событие нового сообщения в WebSocket-клиенты комнаты. Args: event: Событие для логирования или трансляции.
  - `_idle_watchdog(self)`
    - Выполняет вспомогательную обработку для idle watchdog.
  - `_load_room(self, room_id: int)`
    - Загружает room из хранилища с необходимыми проверками. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
  - `_can_read(self, room: Room, user) -> bool`
    - Проверяет условие read и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
  - `_can_write(self, room: Room, user) -> bool`
    - Проверяет условие write и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
  - `_resolve_public_username(self, user) -> str`
    - Определяет public username на основе доступного контекста. Args: user: Пользователь, для которого выполняется операция. Returns: Строковое значение, сформированное функцией.
  - `_resolve_public_ref(self, user) -> str`
    - Определяет public ref на основе доступного контекста. Args: user: Пользователь, для которого выполняется операция. Returns: Строковое значение, сформированное функцией.
  - `_resolve_display_name(self, user) -> str`
    - Определяет display name на основе доступного контекста. Args: user: Пользователь, для которого выполняется операция. Returns: Строковое значение, сформированное функцией.
  - `save_message(self, message, user, username, profile_pic, room, reply_to_id=None)`
    - Сохраняет сообщение и готовит payload для дальнейшей рассылки. Args: message: Сообщение, участвующее в обработке. user: Пользователь, для которого выполняется операция. username: Публичное имя пользователя. profile_pic: Параметр profile pic, используемый в логике функции. room: Комната, в контексте которой выполняется операция. reply_to_id: Идентификатор reply to. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `_get_profile_avatar_state(self, user)`
    - Возвращает profile avatar state из текущего контекста или хранилища. Args: user: Пользователь, для которого выполняется операция. Returns: Функция не возвращает значение.
  - `_is_blocked_in_dm(self, room: Room, user) -> bool`
    - Проверяет условие blocked in dm и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
  - `_rate_limited(self, user) -> bool`
    - Выполняет вспомогательную обработку для rate limited. Args: user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
  - `_rate_limit_retry_after_seconds(self, user) -> int | None`
    - Выполняет вспомогательную обработку для rate limit retry after seconds. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа int | None, полученный при выполнении операции.
  - `_chat_message_rate_limit_scope_key(user) -> str`
    - Выполняет вспомогательную обработку для chat message rate limit scope key. Args: user: Пользователь, для которого выполняется операция. Returns: Строковое значение, сформированное функцией.
  - `_slow_mode_limited(self, user) -> bool`
    - Выполняет вспомогательную обработку для slow mode limited. Args: user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
  - `_handle_typing(self)`
    - Обрабатывает событие typing и выполняет связанную бизнес-логику.
  - `chat_typing(self, event)`
    - Транслирует статус набора текста в комнате. Args: event: Событие для логирования или трансляции.
  - `_get_reply_data(self, saved_message)`
    - Возвращает reply data из текущего контекста или хранилища. Args: saved_message: Сообщение, сохраненное в базе и готовое к публикации. Returns: Функция не возвращает значение.
  - `chat_message_edit(self, event)`
    - Транслирует изменение сообщения в комнате. Args: event: Событие для логирования или трансляции.
  - `chat_message_delete(self, event)`
    - Транслирует удаление сообщения в комнате. Args: event: Событие для логирования или трансляции.
  - `chat_reaction_add(self, event)`
    - Транслирует добавление реакции на сообщение. Args: event: Событие для логирования или трансляции.
  - `chat_reaction_remove(self, event)`
    - Транслирует удаление реакции с сообщения. Args: event: Событие для логирования или трансляции.
  - `chat_read_receipt(self, event)`
    - Транслирует подтверждение чтения сообщения. Args: event: Событие для логирования или трансляции.
  - `chat_membership_revoked(self, event)`
    - Уведомляет клиента о потере доступа к комнате. Args: event: Событие для логирования или трансляции.
  - `_handle_mark_read(self, data)`
    - Обрабатывает событие mark read и выполняет связанную бизнес-логику. Args: data: Словарь входных данных для обработки.
  - `_do_mark_read(self, user, room, last_read_id)`
    - Выполняет вспомогательную обработку для do mark read. Args: user: Пользователь, для которого выполняется операция. room: Комната, в контексте которой выполняется действие. last_read_id: Идентификатор last read.
  - `_build_direct_inbox_targets(self, room_id: int, sender_id: int, message: str, created_at: str)`
    - Формирует direct inbox targets для дальнейшего использования в потоке обработки. Args: room_id: Идентификатор room, используемый для выборки данных. sender_id: Идентификатор sender, используемый для выборки данных. message: Экземпляр сообщения для обработки. created_at: Дата и время создания записи для курсорной пагинации. Returns: Функция не возвращает значение.

## `backend/chat/routing.py`

- Description: WebSocket routing for chat consumers.
- Functions: 0
- Classes: 0

## `backend/chat/services.py`

- Description: Business logic for message operations: edit, delete, reactions, read state.
- Functions: 14
- Classes: 4

### Functions

- `_is_missing_read_receipt_table_error(exc: Exception) -> bool`
  - Определяет, что exact read receipts недоступны из-за непримененной миграции.
- `_attachment_delete_retry_delay(attempt: int) -> float`
  - Удаляет вложение с учетом повтор delay. Args: attempt: Параметр attempt, используемый в логике функции. Returns: Объект типа float, сформированный в ходе выполнения.
- `_load_message_or_raise(room: Room, message_id: int) -> Message`
  - Загружает message or raise из хранилища с необходимыми проверками. Args: room: Экземпляр комнаты, над которой выполняется действие. message_id: Идентификатор message, используемый для выборки данных. Returns: Объект типа Message, сформированный в рамках обработки.
- `_can_manage_message(room: Room, user, message: Message) -> bool`
  - Проверяет условие manage message и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. message: Экземпляр сообщения для обработки. Returns: Логическое значение результата проверки.
- `_within_edit_window(message: Message) -> bool`
  - Выполняет вспомогательную обработку для within edit window. Args: message: Сообщение, участвующее в обработке. Returns: Логическое значение результата проверки.
- `_delete_attachment_blob(storage, blob_name: str | None, *, attachment_id: int, field_name: str) -> None`
  - Удаляет attachment blob и выполняет сопутствующие действия. Args: storage: Объект файлового storage для чтения и удаления blob-файлов. blob_name: Имя объекта в storage, подлежащего удалению или чтению. attachment_id: Идентификатор attachment, используемый для выборки данных. field_name: Имя поля модели, которое содержит путь к файлу.
- `edit_message(user, room: Room, message_id: int, new_content: str) -> Message`
  - Редактирует сообщение. Args: user: Пользователь, для которого выполняется операция. room: Комната, в контексте которой выполняется операция. message_id: Идентификатор сообщения. new_content: Параметр new content, используемый в логике функции. Returns: Объект типа Message, сформированный в ходе выполнения.
- `delete_message(user, room: Room, message_id: int) -> Message`
  - Удаляет message и выполняет сопутствующие действия. Args: user: Пользователь, для которого выполняется операция. room: Экземпляр комнаты, над которой выполняется действие. message_id: Идентификатор message, используемый для выборки данных. Returns: Объект типа Message, сформированный в рамках обработки.
- `add_reaction(user, room: Room, message_id: int, emoji: str) -> Reaction`
  - Добавляет reaction в целевую коллекцию. Args: user: Пользователь, для которого выполняется операция. room: Комната, в контексте которой выполняется операция. message_id: Идентификатор сообщения. emoji: Эмодзи-реакция, над которой выполняется операция. Returns: Объект типа Reaction, сформированный в ходе выполнения.
- `remove_reaction(user, room: Room, message_id: int, emoji: str) -> None`
  - Удаляет reaction из целевого набора данных. Args: user: Пользователь, для которого выполняется операция. room: Экземпляр комнаты, над которой выполняется действие. message_id: Идентификатор message, используемый для выборки данных. emoji: Эмодзи-реакция, которую нужно добавить или удалить.
- `_store_exact_read_receipts(user, room: Room, previous_last_read_message_id: int, next_last_read_message_id: int, *, read_at) -> None`
  - Создает точные receipts для сообщений, впервые попавших в read-диапазон.
- `mark_read(user, room: Room, last_read_message_id: int) -> MessageReadState`
  - Помечает read новым состоянием. Args: user: Пользователь, для которого выполняется операция. room: Экземпляр комнаты, над которой выполняется действие. last_read_message_id: Идентификатор last read message, используемый для выборки данных. Returns: Объект типа MessageReadState, сформированный в рамках обработки.
- `get_message_readers(user, room: Room, message_id: int) -> dict`
  - Возвращает readers конкретного сообщения, если запрос сделал его автор.
- `get_unread_counts(user) -> list[dict]`
  - Возвращает unread counts из текущего контекста или хранилища. Args: user: Пользователь, для которого выполняется операция. Returns: Список типа list[dict] с результатами операции.

### Classes

- `MessageError` : `Exception`
  - Класс MessageError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `MessageNotFoundError` : `MessageError`
  - Класс MessageNotFoundError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `MessageForbiddenError` : `MessageError`
  - Класс MessageForbiddenError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `MessageValidationError` : `MessageError`
  - Класс MessageValidationError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/chat/tests/__init__.py`

- Description: Инициализирует пакет `tests`.
- Functions: 0
- Classes: 0

## `backend/chat/tests/test_access.py`

- Description: Содержит тесты модуля `test_access` подсистемы `chat`.
- Functions: 0
- Classes: 1

### Classes

- `ChatAccessTests` : `TestCase`
  - Группирует тестовые сценарии класса `ChatAccessTests`.
  - Methods: 9
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `test_public_room_permissions(self)`
    - Проверяет сценарий `test_public_room_permissions`.
  - `test_get_user_role_returns_none_for_guest(self)`
    - Проверяет сценарий `test_get_user_role_returns_none_for_guest`.
  - `test_private_room_permissions(self)`
    - Проверяет сценарий `test_private_room_permissions`.
  - `test_public_group_non_member_is_read_only_until_join(self)`
  - `test_direct_room_without_pair_key_denied(self)`
    - Проверяет сценарий `test_direct_room_without_pair_key_denied`.
  - `test_direct_room_pair_key_is_strict(self)`
    - Проверяет сценарий `test_direct_room_pair_key_is_strict`.
  - `test_direct_room_denies_third_user_even_with_role(self)`
    - Проверяет сценарий `test_direct_room_denies_third_user_even_with_role`.
  - `test_ensure_helpers(self)`
    - Проверяет сценарий `test_ensure_helpers`.

## `backend/chat/tests/test_api.py`

- Functions: 0
- Classes: 6

### Classes

- `_BrokenProfileValue`
  - Methods: 2
  - `url(self)`
  - `__str__(self)`
- `ChatApiHelpersTests` : `SimpleTestCase`
  - Methods: 5
  - `setUp(self)`
  - `test_build_profile_pic_url_returns_none_for_empty(self)`
  - `test_build_profile_pic_url_falls_back_to_string_value(self)`
  - `test_parse_positive_int_raises_for_invalid_value(self)`
  - `test_public_room_returns_fallback_when_db_unavailable(self)`
- `RoomDetailsApiTests` : `TestCase`
  - Methods: 6
  - `setUp(self)`
  - `_create_private_room(self)`
  - `test_public_room_details_by_room_id(self)`
  - `test_group_room_details_returns_public_ref_and_avatar_fields(self)`
  - `test_existing_private_room_denies_non_member(self)`
  - `test_existing_private_room_allows_member(self)`
- `RoomMessagesApiTests` : `TestCase`
  - Methods: 9
  - `setUp(self)`
  - `_create_private_room(self)`
  - `_create_direct_room(self)`
  - `_create_public_messages(self, total: int)`
  - `test_room_messages_default_pagination(self)`
  - `test_private_room_messages_require_membership(self)`
  - `test_private_room_messages_allow_member(self)`
  - `test_direct_room_messages_deny_outsider(self)`
  - `test_room_messages_invalid_limit_returns_400(self)`
- `ChatResolveApiTests` : `TestCase`
  - Methods: 12
  - `setUp(self)`
  - `_post_resolve(self, target: str)`
  - `test_direct_resolve_requires_auth(self)`
  - `test_direct_resolve_rejects_self(self)`
  - `test_direct_resolve_rejects_missing_user(self)`
  - `test_resolve_supports_public_room_without_auth(self)`
  - `test_direct_resolve_supports_public_handle_with_at(self)`
  - `test_direct_resolve_supports_numeric_user_id(self)`
  - `test_group_resolve_rejects_removed_legacy_target(self)`
  - `test_group_resolve_supports_public_ref(self)`
  - `test_repeated_direct_resolve_returns_same_room_id(self)`
  - `test_direct_chats_include_dialog_after_resolve(self)`
- `ChatApiExtraCoverageTests` : `TestCase`
  - Methods: 7
  - `setUp(self)`
  - `_post_resolve(self, target: str)`
  - `test_chat_resolve_accepts_form_payload(self)`
  - `test_chat_resolve_returns_503_when_room_creation_fails(self)`
  - `test_chat_resolve_returns_503_when_role_assignment_fails(self)`
  - `test_room_details_returns_fallback_payload_when_db_unavailable(self)`
  - `test_room_messages_returns_404_for_missing_room(self)`

## `backend/chat/tests/test_consumers_chat.py`

- Description: Содержит тесты модуля `test_consumers_chat` подсистемы `chat`.
- Functions: 0
- Classes: 1

### Classes

- `ChatConsumerTests` : `TransactionTestCase`
  - Группирует тестовые сценарии класса `ChatConsumerTests`.
  - Methods: 20
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_connect(self, path: str, user=None)`
    - Проверяет сценарий `_connect`.
  - `test_public_connect(self)`
    - Проверяет сценарий `test_public_connect`.
  - `test_chat_connect_rate_limit(self)`
    - Отклоняет второе подключение с того же IP при жестком лимите.
  - `test_invalid_room_rejected(self)`
    - Проверяет сценарий `test_invalid_room_rejected`.
  - `test_missing_room_rejected(self)`
    - Проверяет сценарий `test_missing_room_rejected`.
  - `test_private_requires_role(self)`
    - Проверяет сценарий `test_private_requires_role`.
  - `test_private_denies_non_member(self)`
    - Проверяет сценарий `test_private_denies_non_member`.
  - `test_private_allows_member(self)`
    - Проверяет сценарий `test_private_allows_member`.
  - `test_direct_denies_non_participant(self)`
    - Проверяет сценарий `test_direct_denies_non_participant`.
  - `test_invalid_json_non_string_and_blank_messages_are_ignored(self)`
    - Проверяет сценарий `test_invalid_json_non_string_and_blank_messages_are_ignored`.
  - `test_typing_event_does_not_crash_socket_and_message_send_still_works(self)`
    - Typing event should not close socket; message send must continue to work.
  - `test_unauthenticated_public_user_cannot_send_messages(self)`
    - Проверяет сценарий `test_unauthenticated_public_user_cannot_send_messages`.
  - `test_viewer_cannot_write(self)`
    - Проверяет сценарий `test_viewer_cannot_write`.
  - `test_message_too_long(self)`
    - Проверяет сценарий `test_message_too_long`.
  - `test_message_persisted(self)`
    - Проверяет сценарий `test_message_persisted`.
  - `test_direct_message_notifies_participants_in_inbox_channel(self)`
    - Проверяет сценарий `test_direct_message_notifies_participants_in_inbox_channel`.
  - `test_direct_message_does_not_notify_non_participant_inbox_channel(self)`
    - Проверяет сценарий `test_direct_message_does_not_notify_non_participant_inbox_channel`.
  - `test_membership_revoked_closes_target_socket(self)`
    - Disconnect target user socket when membership is revoked in room.
  - `test_rate_limit(self)`
    - Проверяет сценарий `test_rate_limit`.

## `backend/chat/tests/test_consumers_direct_inbox.py`

- Description: Содержит тесты модуля `test_consumers_direct_inbox` подсистемы `chat`.
- Functions: 0
- Classes: 1

### Classes

- `DirectInboxConsumerTests` : `TransactionTestCase`
  - Группирует тестовые сценарии класса `DirectInboxConsumerTests`.
  - Methods: 9
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_connect_inbox(self, user=None)`
    - Проверяет сценарий `_connect_inbox`.
  - `_connect_chat(self, room_id: int, user)`
    - Проверяет сценарий `_connect_chat`.
  - `test_guest_connection_is_rejected(self)`
    - Проверяет сценарий `test_guest_connection_is_rejected`.
  - `test_connect_rate_limit_for_inbox(self)`
    - Отклоняет повторное подключение inbox websocket с одного IP.
  - `test_authenticated_user_receives_initial_unread_state(self)`
    - Проверяет сценарий `test_authenticated_user_receives_initial_unread_state`.
  - `test_mark_read_decreases_unread_dialogs(self)`
    - Проверяет сценарий `test_mark_read_decreases_unread_dialogs`.
  - `test_set_active_room_checks_acl(self)`
    - Проверяет сценарий `test_set_active_room_checks_acl`.
  - `test_active_room_stays_unread_until_explicit_mark_read(self)`
    - Проверяет сценарий `test_active_room_stays_unread_until_explicit_mark_read`.

## `backend/chat/tests/test_consumers_helpers.py`

- Description: Содержит тесты модуля `test_consumers_helpers` подсистемы `chat`.
- Functions: 0
- Classes: 6

### Classes

- `WsConnectRateLimitTests` : `TestCase`
  - Проверяет helper лимита подключений WebSocket по IP.
  - Methods: 2
  - `setUp(self)`
    - Очищает кэш перед каждым сценарием.
  - `test_ws_connect_rate_limit_counts_and_resets(self)`
    - Ограничивает частые connect-запросы и сбрасывает окно по reset.
- `PresenceWsConnectRateLimitTests` : `TestCase`
  - Проверяет endpoint-specific настройки rate limit для presence websocket.
  - Methods: 2
  - `setUp(self)`
  - `test_presence_uses_dedicated_limits_without_changing_chat_limit(self)`
- `ChatConsumerInternalTests` : `TestCase`
  - Группирует тестовые сценарии класса `ChatConsumerInternalTests`.
  - Methods: 12
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_consumer(self, user=None)`
    - Проверяет сценарий `_consumer`.
  - `test_chat_target_validation_handles_invalid_regex(self)`
    - Проверяет сценарий `test_chat_target_validation_handles_invalid_regex`.
  - `test_get_profile_avatar_state_returns_empty_when_profile_missing(self)`
    - Проверяет сценарий `test_get_profile_avatar_state_returns_empty_when_profile_missing`.
  - `test_rate_limit_counts_and_resets(self)`
    - Проверяет сценарий `test_rate_limit_counts_and_resets`.
  - `test_rate_limit_ignored_for_superuser(self)`
    - Суперпользователь не ограничивается chat message rate-limit.
  - `test_chat_message_serializes_and_sends_payload(self)`
    - Проверяет сценарий `test_chat_message_serializes_and_sends_payload`.
  - `test_receive_ignores_message_for_anonymous_user(self)`
    - Проверяет сценарий `test_receive_ignores_message_for_anonymous_user`.
  - `test_receive_returns_rate_limit_error(self)`
    - Проверяет сценарий `test_receive_returns_rate_limit_error`.
  - `test_disconnect_without_group_name_is_safe(self)`
    - Проверяет сценарий `test_disconnect_without_group_name_is_safe`.
  - `test_disconnect_discards_group_when_present(self)`
    - Проверяет сценарий `test_disconnect_discards_group_when_present`.
  - `test_idle_watchdog_closes_connection_after_timeout(self)`
    - Проверяет сценарий `test_idle_watchdog_closes_connection_after_timeout`.
- `PresenceConsumerInternalTests` : `TestCase`
  - Группирует тестовые сценарии класса `PresenceConsumerInternalTests`.
  - Methods: 16
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_consumer(self, user=None)`
    - Проверяет сценарий `_consumer`.
  - `test_get_guest_session_key_returns_none_without_session(self)`
    - Проверяет отсутствие session_key у гостя без сессии.
  - `test_receive_ignores_invalid_payload_and_throttles_guest_ping(self)`
    - Проверяет сценарий `test_receive_ignores_invalid_payload_and_throttles_guest_ping`.
  - `test_receive_touches_authenticated_user(self)`
    - Проверяет сценарий `test_receive_touches_authenticated_user`.
  - `test_presence_update_sends_only_non_empty_payload(self)`
    - Проверяет сценарий `test_presence_update_sends_only_non_empty_payload`.
  - `test_heartbeat_stops_when_send_raises(self)`
    - Проверяет сценарий `test_heartbeat_stops_when_send_raises`.
  - `test_idle_watchdog_closes_on_timeout(self)`
    - Проверяет сценарий `test_idle_watchdog_closes_on_timeout`.
  - `test_guest_cache_lifecycle(self)`
    - Проверяет сценарий `test_guest_cache_lifecycle`.
  - `test_add_guest_handles_invalid_existing_count(self)`
    - Проверяет сценарий `test_add_guest_handles_invalid_existing_count`.
  - `test_user_presence_lifecycle_and_get_online_cleanup(self)`
    - Проверяет сценарий `test_user_presence_lifecycle_and_get_online_cleanup`.
  - `test_get_online_and_guest_count_drop_expired_entries(self)`
    - Проверяет сценарий `test_get_online_and_guest_count_drop_expired_entries`.
  - `test_touch_user_and_guest_paths(self)`
    - Проверяет сценарий `test_touch_user_and_guest_paths`.
  - `test_disconnect_paths_for_guest_and_auth(self)`
    - Проверяет сценарий `test_disconnect_paths_for_guest_and_auth`.
  - `test_connect_adds_guest_and_authenticated_users(self)`
    - Проверяет сценарий `test_connect_adds_guest_and_authenticated_users`.
  - `test_connect_closes_when_rate_limited(self)`
    - Закрывает соединение Presence при превышении connect-rate-limit.
- `ChatConsumerDirectInboxTargetsTests` : `TestCase`
  - Группирует тестовые сценарии класса `ChatConsumerDirectInboxTargetsTests`.
  - Methods: 5
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_consumer(self)`
    - Проверяет сценарий `_consumer`.
  - `test_build_targets_returns_empty_for_missing_room(self)`
    - Проверяет сценарий `test_build_targets_returns_empty_for_missing_room`.
  - `test_build_targets_handles_invalid_pair_key(self)`
    - Invalid pair_key disables direct-inbox target fanout.
  - `test_build_targets_requires_pair_memberships(self)`
    - Strict DM mode: without membership for both pair users, no targets are built.
- `DirectInboxConsumerInternalTests` : `TestCase`
  - Группирует тестовые сценарии класса `DirectInboxConsumerInternalTests`.
  - Methods: 7
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `_consumer(self)`
    - Проверяет сценарий `_consumer`.
  - `test_receive_handles_ping_and_payload_guards(self)`
    - Проверяет сценарий `test_receive_handles_ping_and_payload_guards`.
  - `test_receive_set_active_room_branches(self)`
    - Проверяет сценарий `test_receive_set_active_room_branches`.
  - `test_receive_mark_read_branches(self)`
    - Проверяет сценарий `test_receive_mark_read_branches`.
  - `test_direct_event_and_disconnect_and_watchdogs(self)`
    - Проверяет сценарий `test_direct_event_and_disconnect_and_watchdogs`.
  - `test_connect_closes_when_rate_limited(self)`
    - Закрывает direct inbox websocket при превышении лимита connect.

## `backend/chat/tests/test_consumers_presence.py`

- Description: Тесты PresenceConsumer.
- Functions: 0
- Classes: 1

### Classes

- `PresenceConsumerTests` : `TransactionTestCase`
  - Проверяет поведение presence websocket для гостей и авторизованных.
  - Methods: 7
  - `setUp(self)`
  - `_connect(self, user=None, ip='198.51.100.10', port=55000, session_key: str | None=None)`
  - `test_guest_connect_receives_count(self)`
  - `test_authenticated_receives_online_list(self)`
  - `test_guests_count_unique_by_session(self)`
  - `test_guests_with_same_ip_and_different_sessions_are_counted_separately(self)`
  - `test_guest_without_session_is_rejected(self)`

## `backend/chat/tests/test_direct_inbox.py`

- Description: Tests for direct inbox cache-backed state helpers.
- Functions: 0
- Classes: 1

### Classes

- `DirectInboxCacheTests` : `TestCase`
  - Methods: 13
  - `setUp(self)`
  - `test_group_name_and_keys(self)`
  - `test_get_unread_room_ids_normalizes_non_numeric_and_duplicates(self)`
  - `test_mark_unread_ignores_invalid_room_id(self)`
  - `test_mark_unread_adds_dialog_once(self)`
  - `test_mark_read_handles_invalid_room_id(self)`
  - `test_mark_read_clears_cache_when_last_dialog_removed(self)`
  - `test_mark_read_keeps_other_dialogs(self)`
  - `test_touch_active_room_checks_conn_id(self)`
  - `test_clear_active_room_respects_conn_id(self)`
  - `test_clear_active_room_without_conn_id_deletes_key(self)`
  - `test_is_room_active_returns_false_for_non_dict_value(self)`
  - `test_get_unread_state_returns_dialog_count(self)`

## `backend/chat/tests/test_direct_inbox_module.py`

- Description: Smoke test for direct_inbox.state exports used by chat runtime.
- Functions: 0
- Classes: 1

### Classes

- `DirectInboxStateModuleTests` : `SimpleTestCase`
  - Methods: 1
  - `test_module_exports_state_functions(self)`

## `backend/chat/tests/test_health.py`

- Description: Содержит тесты модуля `test_health` подсистемы `chat`.
- Functions: 0
- Classes: 1

### Classes

- `HealthApiTests` : `TestCase`
  - Группирует тестовые сценарии класса `HealthApiTests`.
  - Methods: 2
  - `test_live_health_endpoint(self)`
    - Проверяет сценарий `test_live_health_endpoint`.
  - `test_ready_health_endpoint(self)`
    - Проверяет сценарий `test_ready_health_endpoint`.

## `backend/chat/tests/test_message_features_api.py`

- Description: API coverage for message payload/reactions/search/attachments features.
- Functions: 0
- Classes: 1

### Classes

- `ChatMessageFeatureApiTests` : `TestCase`
  - Methods: 42
  - `setUp(self)`
  - `test_reactions_allowed_in_direct_room(self)`
  - `test_global_search_respects_interaction_scope_for_all_sections(self)`
  - `test_global_search_for_superuser_is_not_limited_by_interaction_scope(self)`
  - `test_global_search_plain_text_includes_matching_handle_groups(self)`
  - `test_global_search_includes_any_matching_public_groups_without_interaction(self)`
  - `test_global_search_handle_excludes_public_group_without_username(self)`
  - `test_global_search_supports_handle_query_for_group_username(self)`
  - `test_global_search_supports_handle_query_for_updated_username(self)`
  - `test_global_search_plain_text_does_not_search_users_by_handle(self)`
  - `test_attachment_upload_accepts_reply_to_and_get_lists_items(self)`
  - `test_attachment_upload_in_public_room_creates_membership_and_media_is_readable(self)`
  - `test_attachment_urls_are_room_scoped_without_signed_query(self)`
  - `test_attachment_upload_rejects_unsupported_content_type_with_code(self)`
  - `test_attachment_upload_accepts_file_key_compat(self)`
  - `test_attachment_upload_accepts_attachments_array_key_compat(self)`
  - `test_attachment_upload_accepts_attachments_key_compat(self)`
  - `test_attachment_upload_returns_code_when_files_missing(self)`
  - `test_attachment_upload_returns_code_when_too_many_files(self)`
  - `test_attachment_upload_allows_too_many_files_for_superuser(self)`
  - `test_attachment_upload_returns_code_for_invalid_reply(self)`
  - `test_attachment_upload_returns_code_when_file_too_large(self)`
  - `test_attachment_upload_allows_oversized_file_for_superuser(self)`
  - `test_attachment_upload_normalizes_audio_mp3_alias(self)`
  - `test_attachment_upload_normalizes_svg_content_type_from_generic_mime(self)`
  - `test_attachment_upload_normalizes_zip_alias_from_windows_mime(self)`
  - `test_attachment_upload_guesses_rar_from_extension_for_x_compressed(self)`
  - `test_attachment_upload_guesses_jar_from_extension_for_octet_stream(self)`
  - `test_mark_read_is_monotonic_and_persisted_in_room_details(self)`
  - `test_mark_read_accepts_form_payload_for_keepalive_flush(self)`
  - `test_message_detail_patch_validates_content_type_and_empty_value(self)`
  - `test_message_detail_patch_and_delete_cover_success_and_not_found(self)`
  - `test_message_detail_delete_returns_forbidden_for_non_author(self)`
  - `test_message_detail_allows_superuser_edit_and_delete_outside_membership(self)`
  - `test_message_detail_delete_removes_attachment_files_when_enabled(self)`
  - `test_message_reactions_handles_forbidden_and_remove_flow(self)`
  - `test_search_messages_handles_validation_and_pagination(self)`
  - `test_mark_read_validation_public_room_and_unread_counts(self)`
  - `test_message_readers_endpoint_returns_direct_read_at_for_author(self)`
  - `test_message_readers_endpoint_returns_group_readers_for_author_only(self)`
  - `test_mark_read_endpoint_survives_missing_receipt_table(self)`
  - `test_message_readers_endpoint_survives_missing_receipt_table(self)`

## `backend/chat/tests/test_models.py`

- Description: Tests for chat models.
- Functions: 0
- Classes: 1

### Classes

- `ChatModelsTests` : `TestCase`
  - Model-level behavior and signal tests.
  - Methods: 6
  - `test_message_str_uses_related_user_when_available(self)`
  - `test_message_str_falls_back_to_username_field(self)`
  - `test_room_str_returns_name(self)`
  - `test_room_defaults_to_private_kind(self)`
  - `test_role_str(self)`
  - `test_role_signal_writes_security_audit_logs(self)`

## `backend/chat/tests/test_roles_api.py`

- Description: Tests for room-scoped role management endpoints.
- Functions: 0
- Classes: 1

### Classes

- `RoomRolesApiTests` : `TestCase`
  - Methods: 13
  - `setUp(self)`
  - `_url(self, suffix: str) -> str`
  - `test_roles_api_denies_user_without_manage_roles(self)`
  - `test_owner_can_create_patch_and_delete_role(self)`
  - `test_owner_cannot_create_role_at_same_hierarchy_position(self)`
  - `test_member_roles_get_and_patch(self)`
  - `test_member_roles_reject_cross_room_role_id(self)`
  - `test_overrides_crud(self)`
  - `test_permissions_me_returns_effective_flags(self)`
  - `test_permissions_me_for_public_group_non_member_is_read_only_joinable(self)`
  - `test_direct_room_rejects_role_management(self)`
  - `test_permissions_me_hides_private_room_for_outsider(self)`
  - `test_superuser_can_manage_roles_without_room_membership(self)`

## `backend/chat/tests/test_services.py`

- Description: Unit tests for chat.services business logic.
- Functions: 0
- Classes: 1

### Classes

- `ChatServicesTests` : `TestCase`
  - Methods: 24
  - `setUp(self)`
  - `_message(self, *, user=None, content='hello')`
  - `test_edit_message_validates_payload(self)`
  - `test_edit_message_raises_not_found_for_missing_message(self)`
  - `test_edit_message_raises_forbidden_for_non_author_without_permission(self)`
  - `test_edit_message_raises_when_author_window_expired(self)`
  - `test_edit_message_window_zero_allows_old_message(self)`
  - `test_edit_message_updates_message_and_preserves_original(self)`
  - `test_delete_message_forbidden_and_success(self)`
  - `test_delete_message_deletes_attachment_files_when_enabled(self)`
  - `test_delete_message_keeps_attachment_files_when_delete_disabled(self)`
  - `test_delete_message_logs_storage_errors_and_continues(self)`
  - `test_delete_message_retries_locked_file_delete_on_windows(self)`
  - `test_add_reaction_validates_permission_and_missing_message(self)`
  - `test_add_and_remove_reaction_are_idempotent(self)`
  - `test_mark_read_requires_existing_message_and_is_monotonic(self)`
  - `test_mark_read_stores_exact_receipts_only_for_new_foreign_messages(self)`
  - `test_mark_read_retries_and_raises_operational_error(self)`
  - `test_mark_read_keeps_room_cursor_when_receipt_table_is_missing(self)`
  - `test_get_message_readers_requires_author_and_returns_group_receipts(self)`
  - `test_get_message_readers_returns_direct_read_at_only(self)`
  - `test_get_message_readers_returns_empty_when_receipt_table_is_missing(self)`
  - `test_get_direct_message_readers_returns_empty_when_receipt_table_is_missing(self)`
  - `test_get_unread_counts_returns_only_rooms_with_unread(self)`

## `backend/chat/tests/test_utils.py`

- Description: Содержит тесты модуля `test_utils` подсистемы `chat`.
- Functions: 0
- Classes: 5

### Classes

- `UtilityHelpersTests` : `SimpleTestCase`
  - Группирует тестовые сценарии класса `UtilityHelpersTests`.
  - Methods: 9
  - `test_decode_header_variants(self)`
    - Проверяет сценарий `test_decode_header_variants`.
  - `test_normalize_scheme(self)`
    - Проверяет сценарий `test_normalize_scheme`.
  - `test_normalize_base_url(self)`
    - Проверяет сценарий `test_normalize_base_url`.
  - `test_base_from_host_and_scheme(self)`
    - Проверяет сценарий `test_base_from_host_and_scheme`.
  - `test_normalize_media_path_and_signed_path(self)`
    - Проверяет нормализацию media пути и сборку подписанного URL.
  - `test_media_signature_validation_rejects_bad_signature(self)`
    - Отклоняет некорректную подпись media URL.
  - `test_internal_host_and_origin_preference(self)`
    - Проверяет сценарий `test_internal_host_and_origin_preference`.
  - `test_pick_base_url_priority(self)`
    - Проверяет сценарий `test_pick_base_url_priority`.
  - `test_coerce_media_source(self)`
    - Проверяет сценарий `test_coerce_media_source`.
- `_SignedUrlAssertionsMixin`
  - Содержит общие проверки для подписанных URL профиля.
  - Methods: 1
  - `assert_signed_media_url(self, url: str | None, expected_base: str | None)`
    - Проверяет базу URL и корректность подписи query-параметров.
- `BuildProfileUrlTests` : `_SignedUrlAssertionsMixin, SimpleTestCase`
  - Группирует тестовые сценарии класса `BuildProfileUrlTests`.
  - Methods: 8
  - `_scope(self, headers=None, server=None, scheme='ws')`
    - Возвращает базовый ASGI scope для тестов построения URL.
  - `test_prefers_host_over_origin_for_local_dev(self)`
    - Проверяет сценарий `test_prefers_host_over_origin_for_local_dev`.
  - `test_prefers_origin_when_host_is_internal_but_origin_is_public(self)`
    - Проверяет сценарий `test_prefers_origin_when_host_is_internal_but_origin_is_public`.
  - `test_uses_forwarded_host_and_proto(self)`
    - Проверяет сценарий `test_uses_forwarded_host_and_proto`.
  - `test_falls_back_to_server(self)`
    - Проверяет сценарий `test_falls_back_to_server`.
  - `test_rewrites_internal_absolute_url(self)`
    - Проверяет сценарий `test_rewrites_internal_absolute_url`.
  - `test_keeps_absolute_url(self)`
    - Проверяет сценарий `test_keeps_absolute_url`.
  - `test_rejects_traversal_path(self)`
    - Проверяет сценарий `test_rejects_traversal_path`.
- `BuildProfileUrlFromRequestTests` : `_SignedUrlAssertionsMixin, SimpleTestCase`
  - Группирует тестовые сценарии класса `BuildProfileUrlFromRequestTests`.
  - Methods: 8
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `test_request_prefers_host_over_origin_for_local_dev(self)`
    - Проверяет сценарий `test_request_prefers_host_over_origin_for_local_dev`.
  - `test_request_prefers_origin_when_host_is_internal_but_origin_is_public(self)`
    - Проверяет сценарий `test_request_prefers_origin_when_host_is_internal_but_origin_is_public`.
  - `test_request_prefers_configured_public_base(self)`
    - Проверяет сценарий `test_request_prefers_configured_public_base`.
  - `test_request_uses_forwarded_host_and_proto(self)`
    - Проверяет сценарий `test_request_uses_forwarded_host_and_proto`.
  - `test_request_rewrites_internal_absolute_url(self)`
    - Проверяет сценарий `test_request_rewrites_internal_absolute_url`.
  - `test_request_rewrites_public_absolute_media_url(self)`
    - Проверяет сценарий `test_request_rewrites_public_absolute_media_url`.
  - `test_request_returns_relative_path_when_host_is_unavailable(self)`
    - Проверяет сценарий `test_request_returns_relative_path_when_host_is_unavailable`.
- `BuildRoomMediaUrlFromRequestTests` : `SimpleTestCase`
  - Methods: 3
  - `setUp(self)`
  - `test_builds_room_scoped_attachment_url(self)`
  - `test_rejects_non_attachment_paths_and_bad_room_id(self)`

## `backend/chat/utils.py`

- Description: Shared chat utilities and backward-compatible re-exports.
- Functions: 1
- Classes: 0

### Functions

- `is_valid_chat_target(value: str) -> bool`
  - Validate a public chat target against the configured runtime regex.

## `backend/chat_app_django/__init__.py`

- Description: Инициализирует пакет `chat_app_django`.
- Functions: 0
- Classes: 0

## `backend/chat_app_django/asgi.py`

- Description: ASGI config for chat_app_django.
- Functions: 0
- Classes: 0

## `backend/chat_app_django/health.py`

- Description: Health endpoints for liveness and readiness checks.
- Functions: 2
- Classes: 0

### Functions

- `live(_request)`
  - Вспомогательная функция `live` реализует внутренний шаг бизнес-логики. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `ready(_request)`
  - Инициализирует интеграции и сигналы при запуске приложения. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/chat_app_django/http_utils.py`

- Description: Общие HTTP-утилиты для API-слоя: парсинг payload и единые ошибки.
- Functions: 2
- Classes: 0

### Functions

- `parse_request_payload(request) -> Mapping[str, object]`
  - Разбирает request payload из входных данных с валидацией формата. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Объект типа Mapping[str, object], сформированный в рамках обработки.
- `error_response(*, status: int, error: str | None=None, detail: str | None=None, errors: Mapping[str, list[str] | str] | None=None) -> Response`
  - Формирует структуру ошибки response для ответа API. Args: status: HTTP-статус ответа, который будет возвращен клиенту. error: Короткий код ошибки для машинной обработки на клиенте. detail: Подробное описание ошибки для отображения и диагностики. errors: Набор ошибок валидации, сгруппированных по полям. Returns: HTTP-ответ с данными результата операции.

## `backend/chat_app_django/ip_utils.py`

- Description: Модуль ip_utils реализует прикладную логику подсистемы chat_app_django.
- Functions: 10
- Classes: 0

### Functions

- `_decode_header(value: bytes | None) -> str | None`
  - Декодирует header из внешнего представления. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_first_value(value: str | None) -> str | None`
  - Выполняет вспомогательную обработку для first value. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, полученный при выполнении операции.
- `_split_values(value: str | None) -> list[str]`
  - Разбивает цепочку IP-адресов заголовка на отдельные значения.
- `_parse_ip(value: str | None) -> str | None`
  - Разбирает ip из входных данных с валидацией формата. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_pick_ip_from_chain(value: str | None) -> str | None`
  - Выбирает клиентский IP из цепочки X-Forwarded-For-подобного заголовка. Логика: 1. Валидируем все IP из цепочки. 2. Идем справа налево и пропускаем доверенные proxy. 3. Берем первый IP, который не входит в trusted proxy ranges. 4. Если все IP доверенные, возвращаем первый валидный.
- `_trusted_networks() -> list`
  - Выполняет вспомогательную обработку для trusted networks. Returns: Список типа list с результатами операции.
- `is_trusted_proxy(ip: str | None) -> bool`
  - Проверяет условие trusted proxy и возвращает логический результат. Args: ip: IP-адрес клиента или узла, выполняющего запрос. Returns: Логическое значение результата проверки.
- `_pick_ip(candidates: list[str | None]) -> str | None`
  - Выбирает ip из набора кандидатов по заданным правилам. Args: candidates: Набор кандидатных значений для выбора валидного результата. Returns: Объект типа str | None, сформированный в рамках обработки.
- `get_client_ip_from_request(request) -> str | None`
  - Возвращает client ip from request из текущего контекста или хранилища. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Объект типа str | None, сформированный в рамках обработки.
- `get_client_ip_from_scope(scope) -> str | None`
  - Возвращает client ip from scope из текущего контекста или хранилища. Args: scope: ASGI-scope с метаданными соединения. Returns: Объект типа str | None, сформированный в рамках обработки.

## `backend/chat_app_django/media_utils.py`

- Description: Утилиты media URL: signed-ссылки, room-scoped ссылки и crop аватарок.
- Functions: 23
- Classes: 0

### Functions

- `serialize_avatar_crop(profile) -> dict[str, float] | None`
  - Сериализует avatar crop в формат, пригодный для передачи клиенту. Args: profile: Профиль пользователя, для которого вычисляется состояние. Returns: Словарь типа dict[str, float] | None с результатами операции.
- `_decode_header(value: bytes | None) -> str | None`
  - Декодирует header из внешнего представления. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_get_header(scope, name: bytes) -> str | None`
  - Возвращает header из текущего контекста или хранилища. Args: scope: ASGI-scope с метаданными соединения. name: Человекочитаемое имя сущности или объекта. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_first_value(value: str | None) -> str | None`
  - Выполняет вспомогательную обработку для first value. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, полученный при выполнении операции.
- `_normalize_scheme(value: str | None) -> str | None`
  - Нормализует scheme к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_normalize_base_url(value: str | None) -> str | None`
  - Нормализует base url к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_base_from_host_and_scheme(host: str | None, scheme: str | None) -> str | None`
  - Вспомогательная функция `_base_from_host_and_scheme` реализует внутренний шаг бизнес-логики. Args: host: Параметр host, используемый в логике функции. scheme: Параметр scheme, используемый в логике функции. Returns: Объект типа str | None, сформированный в ходе выполнения.
- `normalize_media_path(image_name: str | None) -> str | None`
  - Нормализует media path к внутреннему формату приложения. Args: image_name: Имя файла изображения в media-хранилище. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_is_internal_host(hostname: str | None) -> bool`
  - Проверяет условие internal host и возвращает логический результат. Args: hostname: Имя хоста без схемы и дополнительных частей URL. Returns: Логическое значение результата проверки.
- `_hostname_from_base(base: str | None) -> str | None`
  - Вспомогательная функция `_hostname_from_base` реализует внутренний шаг бизнес-логики. Args: base: Параметр base, используемый в логике функции. Returns: Объект типа str | None, сформированный в ходе выполнения.
- `_should_prefer_origin(candidate_base: str | None, origin_base: str | None) -> bool`
  - Определяет, нужно ли выполнять действие prefer origin. Args: candidate_base: Кандидат на роль базового URL для валидации и выбора. origin_base: Базовый URL, полученный из заголовка Origin. Returns: Логическое значение результата проверки.
- `_pick_base_url(configured_base: str | None, forwarded_base: str | None, host_base: str | None, origin_base: str | None) -> str | None`
  - Выбирает base url из набора кандидатов по заданным правилам. Args: configured_base: Базовый URL, заданный в конфигурации приложения. forwarded_base: Базовый URL, восстановленный из прокси-заголовков. host_base: Базовый URL, собранный из host и схемы запроса. origin_base: Базовый URL, полученный из заголовка Origin. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_coerce_media_source(image_name: str | None, trusted_hosts: set[str] | None=None) -> str | None`
  - Преобразует media source к допустимому типу или формату. Args: image_name: Имя файла изображения в media-хранилище. trusted_hosts: Список доверенных хостов для проверки безопасности URL. Returns: Объект типа str | None, сформированный в рамках обработки.
- `_media_signing_key() -> bytes`
  - Выполняет вспомогательную обработку для media signing key. Returns: Объект типа bytes, полученный при выполнении операции.
- `_media_signature(path: str, expires_at: int) -> str`
  - Вспомогательная функция `_media_signature` реализует внутренний шаг бизнес-логики. Args: path: Путь ресурса в storage или URL-маршруте. expires_at: Параметр expires at, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `is_valid_media_signature(path: str, expires_at: int, signature: str | None) -> bool`
  - Проверяет условие valid media signature и возвращает логический результат. Args: path: Путь к ресурсу в storage или media-каталоге. expires_at: Метка времени истечения срока действия ссылки или токена. signature: Криптографическая подпись для валидации целостности ссылки. Returns: Логическое значение результата проверки.
- `_signed_media_url_path(image_name: str | None, expires_at: int | None=None) -> str | None`
  - Вспомогательная функция `_signed_media_url_path` реализует внутренний шаг бизнес-логики. Args: image_name: Параметр image name, используемый в логике функции. expires_at: Параметр expires at, используемый в логике функции. Returns: Объект типа str | None, сформированный в ходе выполнения.
- `is_chat_attachment_media_path(path: str | None) -> bool`
  - Проверяет условие chat attachment media path и возвращает логический результат. Args: path: Путь к ресурсу в storage или media-каталоге. Returns: Логическое значение результата проверки.
- `_parse_positive_room_id(room_id: int | str | None) -> int | None`
  - Разбирает positive room id из входных данных с валидацией формата. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа int | None, сформированный в рамках обработки.
- `_room_scoped_media_url_path(image_name: str | None, room_id: int | str | None) -> str | None`
  - Вспомогательная функция `_room_scoped_media_url_path` реализует внутренний шаг бизнес-логики. Args: image_name: Параметр image name, используемый в логике функции. room_id: Идентификатор комнаты. Returns: Объект типа str | None, сформированный в ходе выполнения.
- `build_room_media_url_from_request(request, image_name: str | None, room_id: int | str | None) -> str | None`
  - Формирует room media url from request для дальнейшего использования в потоке обработки. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. image_name: Имя файла изображения в media-хранилище. room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа str | None, сформированный в рамках обработки.
- `build_profile_url_from_request(request, image_name: str | None) -> str | None`
  - Формирует profile url from request для дальнейшего использования в потоке обработки. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. image_name: Имя файла изображения в media-хранилище. Returns: Объект типа str | None, сформированный в рамках обработки.
- `build_profile_url(scope, image_name: str | None) -> str | None`
  - Формирует profile url для дальнейшего использования в потоке обработки. Args: scope: ASGI-scope с метаданными соединения. image_name: Имя файла изображения в media-хранилище. Returns: Объект типа str | None, сформированный в рамках обработки.

## `backend/chat_app_django/meta_api.py`

- Description: Read-only meta endpoints for frontend runtime configuration.
- Functions: 1
- Classes: 0

### Functions

- `client_config_view(_request)`
  - Обрабатывает API-представление для client config. Args: _request: HTTP-запрос, не используемый напрямую в теле функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/chat_app_django/security/__init__.py`

- Description: Инфраструктурный пакет подсистемы security.
- Functions: 0
- Classes: 0

## `backend/chat_app_django/security/audit.py`

- Description: Facade for centralized security audit.
- Functions: 0
- Classes: 0

## `backend/chat_app_django/security/rate_limit.py`

- Description: Centralized persistent rate-limit service backed by the DB.
- Functions: 0
- Classes: 2

### Classes

- `RateLimitPolicy`
  - Класс RateLimitPolicy инкапсулирует связанную бизнес-логику модуля.
  - Methods: 2
  - `normalized_limit(self) -> int`
    - Вспомогательная функция `normalized_limit` реализует внутренний шаг бизнес-логики. Returns: Целочисленный результат вычисления.
  - `normalized_window(self) -> int`
    - Вспомогательная функция `normalized_window` реализует внутренний шаг бизнес-логики. Returns: Целочисленный результат вычисления.
- `DbRateLimiter`
  - Класс DbRateLimiter инкапсулирует связанную бизнес-логику модуля.
  - Methods: 2
  - `is_limited(cls, scope_key: str, policy: RateLimitPolicy) -> bool`
    - Проверяет условие limited и возвращает логический результат. Args: scope_key: Уникальный ключ области действия для счетчика лимитов. policy: Политика rate-limit с лимитом и временным окном. Returns: Логическое значение результата проверки.
  - `retry_after_seconds(cls, scope_key: str) -> int | None`
    - Вспомогательная функция `retry_after_seconds` реализует внутренний шаг бизнес-логики. Args: scope_key: Параметр scope key, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.

## `backend/chat_app_django/security/rate_limit_config.py`

- Description: Centralized rate-limit policy readers. This module is the single architecture entry point for reading runtime rate-limit configuration from Django settings. Why it exists: - keep policy lookup in one place; - avoid duplicating env/default logic across consumers and APIs; - read all rate-limit policies from the unified RATE_LIMITS mapping.
- Functions: 8
- Classes: 0

### Functions

- `_positive_int(value: Any, fallback: int) -> int`
  - Вспомогательная функция `_positive_int` реализует внутренний шаг бизнес-логики. Args: value: Значение, которое нужно нормализовать или проверить. fallback: Параметр fallback, используемый в логике функции. Returns: Целочисленный результат вычисления.
- `_rate_limits_mapping() -> Mapping[str, Any]`
  - Выполняет вспомогательную обработку для rate limits mapping. Returns: Объект типа Mapping[str, Any], полученный при выполнении операции.
- `_section(name: str) -> Mapping[str, Any]`
  - Выполняет вспомогательную обработку для section. Args: name: Человекочитаемое имя объекта или параметра. Returns: Объект типа Mapping[str, Any], полученный при выполнении операции.
- `_section_policy(*, section_name: str, default_limit: int, default_window: int) -> RateLimitPolicy`
  - Вспомогательная функция `_section_policy` реализует внутренний шаг бизнес-логики. Args: section_name: Параметр section name, используемый в логике функции. default_limit: Параметр default limit, используемый в логике функции. default_window: Параметр default window, используемый в логике функции. Returns: Объект типа RateLimitPolicy, сформированный в ходе выполнения.
- `auth_rate_limit_policy() -> RateLimitPolicy`
  - Вспомогательная функция `auth_rate_limit_policy` реализует внутренний шаг бизнес-логики. Returns: Объект типа RateLimitPolicy, сформированный в ходе выполнения.
- `chat_message_rate_limit_policy() -> RateLimitPolicy`
  - Вспомогательная функция `chat_message_rate_limit_policy` реализует внутренний шаг бизнес-логики. Returns: Объект типа RateLimitPolicy, сформированный в ходе выполнения.
- `ws_connect_rate_limit_policy(endpoint: str) -> RateLimitPolicy`
  - Вспомогательная функция `ws_connect_rate_limit_policy` реализует внутренний шаг бизнес-логики. Args: endpoint: Параметр endpoint, используемый в логике функции. Returns: Объект типа RateLimitPolicy, сформированный в ходе выполнения.
- `ws_connect_rate_limit_disabled() -> bool`
  - Вспомогательная функция `ws_connect_rate_limit_disabled` реализует внутренний шаг бизнес-логики. Returns: Логическое значение результата проверки.

## `backend/chat_app_django/tests/__init__.py`

- Description: Инициализирует пакет `tests`.
- Functions: 0
- Classes: 0

## `backend/chat_app_django/tests/test_admin_login.py`

- Description: Admin auth regression tests.
- Functions: 0
- Classes: 1

### Classes

- `AdminLoginTests` : `TestCase`
  - Methods: 1
  - `test_createsuperuser_credentials_work_in_admin_login(self)`

## `backend/chat_app_django/tests/test_api_index.py`

- Description: Tests for API index and interactive renderer configuration.
- Functions: 0
- Classes: 2

### Classes

- `ApiIndexTests` : `TestCase`
  - Methods: 2
  - `test_api_index_returns_links_map(self)`
  - `test_api_index_is_browsable_in_debug(self)`
- `RendererSettingsTests` : `TestCase`
  - Methods: 2
  - `test_build_rest_renderer_classes_debug_true(self)`
  - `test_build_rest_renderer_classes_debug_false(self)`

## `backend/chat_app_django/tests/test_browsable_api_forms.py`

- Description: Tests for Browsable API HTML forms used in manual testing.
- Functions: 0
- Classes: 1

### Classes

- `BrowsableApiFormsTests` : `TestCase`
  - Methods: 8
  - `setUp(self)`
  - `_get_html(self, path: str, expected_status: int=200) -> str`
  - `test_login_endpoint_rejects_get_for_browsable_form(self)`
  - `test_register_endpoint_rejects_get_for_browsable_form(self)`
  - `test_chat_resolve_form_shows_target_for_authenticated_user(self)`
  - `test_profile_form_shows_profile_update_fields_for_authenticated_user(self)`
  - `test_friends_send_request_form_shows_username_for_authenticated_user(self)`
  - `test_friends_block_form_shows_username_for_authenticated_user(self)`

## `backend/chat_app_django/tests/test_health.py`

- Description: Содержит тесты модуля `test_health` подсистемы `chat_app_django`.
- Functions: 0
- Classes: 1

### Classes

- `HealthUnitTests` : `SimpleTestCase`
  - Группирует тестовые сценарии класса `HealthUnitTests`.
  - Methods: 3
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `test_live_returns_ok(self)`
    - Проверяет сценарий `test_live_returns_ok`.
  - `test_ready_returns_503_when_dependencies_fail(self, mocked_connections, mocked_cache)`
    - Проверяет сценарий `test_ready_returns_503_when_dependencies_fail`.

## `backend/chat_app_django/tests/test_http_utils.py`

- Functions: 0
- Classes: 2

### Classes

- `_BodyRaisesRequest`
  - Methods: 1
  - `body(self)`
- `HttpUtilsTests` : `SimpleTestCase`
  - Methods: 5
  - `test_parse_request_payload_returns_dict_from_json_body(self)`
  - `test_parse_request_payload_falls_back_to_post_for_invalid_or_non_dict_json(self)`
  - `test_parse_request_payload_handles_raw_post_data_exception(self)`
  - `test_parse_request_payload_uses_post_when_body_empty(self)`
  - `test_error_response_includes_detail_and_errors(self)`

## `backend/chat_app_django/tests/test_ip_utils.py`

- Description: Содержит тесты модуля `test_ip_utils` подсистемы `chat_app_django`.
- Functions: 0
- Classes: 1

### Classes

- `IpUtilsTests` : `SimpleTestCase`
  - Группирует тестовые сценарии класса `IpUtilsTests`.
  - Methods: 13
  - `setUp(self)`
    - Проверяет сценарий `setUp`.
  - `tearDown(self)`
    - Проверяет сценарий `tearDown`.
  - `test_decode_header_and_parse_helpers(self)`
    - Проверяет сценарий `test_decode_header_and_parse_helpers`.
  - `test_request_uses_remote_addr_when_proxy_untrusted(self)`
    - Проверяет сценарий `test_request_uses_remote_addr_when_proxy_untrusted`.
  - `test_request_uses_cf_connecting_ip_when_proxy_trusted(self)`
    - Проверяет сценарий `test_request_uses_cf_connecting_ip_when_proxy_trusted`.
  - `test_request_prefers_x_forwarded_for_over_x_real_ip_for_trusted_proxy(self)`
    - Проверяет сценарий `test_request_prefers_x_forwarded_for_over_x_real_ip_for_trusted_proxy`.
  - `test_request_extracts_client_ip_when_proxy_ip_is_first_in_chain(self)`
    - Проверяет сценарий `test_request_extracts_client_ip_when_proxy_ip_is_first_in_chain`.
  - `test_request_extracts_client_ip_when_proxy_ip_is_last_in_chain(self)`
    - Проверяет сценарий `test_request_extracts_client_ip_when_proxy_ip_is_last_in_chain`.
  - `test_request_falls_back_to_remote_when_forwarded_is_invalid(self)`
    - Проверяет сценарий `test_request_falls_back_to_remote_when_forwarded_is_invalid`.
  - `test_scope_uses_forwarded_when_proxy_trusted(self)`
    - Проверяет сценарий `test_scope_uses_forwarded_when_proxy_trusted`.
  - `test_scope_prefers_x_forwarded_for_over_x_real_ip_for_trusted_proxy(self)`
    - Проверяет сценарий `test_scope_prefers_x_forwarded_for_over_x_real_ip_for_trusted_proxy`.
  - `test_scope_extracts_client_ip_when_proxy_ip_is_first_in_chain(self)`
    - Проверяет сценарий `test_scope_extracts_client_ip_when_proxy_ip_is_first_in_chain`.
  - `test_scope_falls_back_to_remote_for_invalid_forwarded_header(self)`
    - Проверяет сценарий `test_scope_falls_back_to_remote_for_invalid_forwarded_header`.

## `backend/chat_app_django/tests/test_meta_api.py`

- Description: Tests for frontend runtime client-config endpoint.
- Functions: 0
- Classes: 1

### Classes

- `ClientConfigApiTests` : `TestCase`
  - Ensures runtime config endpoint exposes backend source-of-truth limits.
  - Methods: 1
  - `test_client_config_returns_expected_shape(self)`

## `backend/chat_app_django/tests/test_rate_limit_config.py`

- Functions: 0
- Classes: 1

### Classes

- `RateLimitConfigTests` : `SimpleTestCase`
  - Methods: 2
  - `test_uses_centralized_rate_limits_mapping(self)`
  - `test_defaults_are_used_when_rate_limits_section_missing(self)`

## `backend/chat_app_django/tests/test_rate_limit_service.py`

- Functions: 0
- Classes: 1

### Classes

- `RateLimitServiceTests` : `TestCase`
  - Methods: 7
  - `test_policy_normalization_clamps_values(self)`
  - `test_empty_scope_key_is_fail_closed(self)`
  - `test_integrity_error_retries_and_fails_closed_after_max_attempts(self)`
  - `test_unexpected_exception_is_fail_closed(self)`
  - `test_retry_after_seconds_returns_remaining_time(self)`
  - `test_retry_after_seconds_returns_none_for_missing_or_expired_bucket(self)`
  - `test_retry_after_seconds_empty_scope_is_fail_closed_value(self)`

## `backend/chat_app_django/urls.py`

- Description: URL routing for chat_app_django.
- Functions: 5
- Classes: 0

### Functions

- `_absolute(request, raw_path: str) -> str`
  - Вспомогательная функция `_absolute` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. raw_path: Параметр raw path, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `_link(request, name: str, kwargs: dict | None=None) -> str | None`
  - Выполняет вспомогательную обработку для link. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. name: Человекочитаемое имя объекта или параметра. kwargs: Дополнительные именованные аргументы вызова. Returns: Объект типа str | None, полученный при выполнении операции.
- `_first_link(request, names: list[str]) -> str | None`
  - Вспомогательная функция `_first_link` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. names: Параметр names, используемый в логике функции. Returns: Объект типа str | None, сформированный в ходе выполнения.
- `api_index(request)`
  - Вспомогательная функция `api_index` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `api_root(request)`
  - Вспомогательная функция `api_root` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/chat_app_django/wsgi.py`

- Description: Модуль wsgi реализует прикладную логику подсистемы chat_app_django.
- Functions: 0
- Classes: 0

## `backend/direct_inbox/__init__.py`

- Functions: 0
- Classes: 0

## `backend/direct_inbox/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `DirectInboxConfig` : `AppConfig`
  - Класс DirectInboxConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/direct_inbox/constants.py`

- Description: Direct inbox subsystem constants.
- Functions: 0
- Classes: 0

## `backend/direct_inbox/consumers.py`

- Description: WebSocket consumer for direct message inbox state.
- Functions: 2
- Classes: 1

### Functions

- `_to_async(func: Callable[..., T]) -> Callable[..., Awaitable[T]]`
  - Вспомогательная функция `_to_async` реализует внутренний шаг бизнес-логики. Args: func: Параметр func, используемый в логике функции. Returns: Объект типа Callable[..., Awaitable[T]], сформированный в ходе выполнения.
- `_ws_connect_rate_limited(scope, endpoint: str) -> bool`
  - Выполняет вспомогательную обработку для ws connect rate limited. Args: scope: ASGI-scope с метаданными соединения. endpoint: Идентификатор API/WS endpoint для применения правил. Returns: Логическое значение результата проверки.

### Classes

- `DirectInboxConsumer` : `AsyncWebsocketConsumer`
  - Класс DirectInboxConsumer обрабатывает WebSocket-события и сообщения.
  - Methods: 22
  - `connect(self)`
    - Устанавливает соединение и выполняет проверки доступа.
  - `disconnect(self, code)`
    - Корректно закрывает соединение и освобождает ресурсы. Args: code: Код ошибки или состояния.
  - `receive(self, text_data=None, bytes_data=None)`
    - Принимает входящее сообщение и маршрутизирует его обработку. Args: text_data: Параметр text data, используемый в логике функции. bytes_data: Параметр bytes data, используемый в логике функции.
  - `direct_inbox_event(self, event)`
    - Обрабатывает WebSocket-событие direct inbox event. Args: event: Событие для логирования или трансляции.
  - `_send_unread_state(self)`
    - Выполняет вспомогательную обработку для send unread state.
  - `_send_error(self, code: str)`
    - Выполняет вспомогательную обработку для send error. Args: code: Код ошибки или состояния.
  - `_heartbeat(self)`
    - Выполняет вспомогательную обработку для heartbeat.
  - `_idle_watchdog(self)`
    - Выполняет вспомогательную обработку для idle watchdog.
  - `_load_room_sync(self, room_id: int) -> Room | None`
    - Загружает room sync из хранилища с необходимыми проверками. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа Room | None, сформированный в рамках обработки.
  - `_load_room(self, room_id: int) -> Room | None`
    - Загружает room из хранилища с необходимыми проверками. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа Room | None, сформированный в рамках обработки.
  - `_can_read_sync(self, room: Room) -> bool`
    - Проверяет условие read sync и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Логическое значение результата проверки.
  - `_can_read(self, room: Room) -> bool`
    - Проверяет условие read и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Логическое значение результата проверки.
  - `_get_unread_state_sync(self) -> dict[str, Any]`
    - Возвращает unread state sync из текущего контекста или хранилища. Returns: Словарь типа dict[str, Any] с результатами операции.
  - `_get_unread_state(self) -> dict[str, Any]`
    - Возвращает unread state из текущего контекста или хранилища. Returns: Словарь типа dict[str, Any] с результатами операции.
  - `_mark_read_sync(self, room_id: int) -> dict[str, Any]`
    - Помечает read sync новым состоянием. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Словарь типа dict[str, Any] с результатами операции.
  - `_mark_read(self, room_id: int) -> dict[str, Any]`
    - Помечает read новым состоянием. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Словарь типа dict[str, Any] с результатами операции.
  - `_set_active_room_sync(self, room_id: int) -> None`
    - Устанавливает active room sync с учетом текущих правил приложения. Args: room_id: Идентификатор room, используемый для выборки данных.
  - `_set_active_room(self, room_id: int) -> None`
    - Устанавливает active room с учетом текущих правил приложения. Args: room_id: Идентификатор room, используемый для выборки данных.
  - `_clear_active_room_sync(self, conn_only: bool=False) -> None`
    - Очищает active room sync и сбрасывает связанное состояние. Args: conn_only: Флаг отправки обновления только в текущее соединение.
  - `_clear_active_room(self, conn_only: bool=False) -> None`
    - Очищает active room и сбрасывает связанное состояние. Args: conn_only: Флаг отправки обновления только в текущее соединение.
  - `_touch_active_room_sync(self) -> None`
    - Обновляет метку активности для active room sync.
  - `_touch_active_room(self) -> None`
    - Обновляет метку активности для active room.

## `backend/direct_inbox/state.py`

- Description: Cache-backed unread/active state for direct messages.
- Functions: 15
- Classes: 0

### Functions

- `user_group_name(user_id: int) -> str`
  - Вспомогательная функция `user_group_name` реализует внутренний шаг бизнес-логики. Args: user_id: Идентификатор user. Returns: Строковое значение, сформированное функцией.
- `unread_key(user_id: int) -> str`
  - Вспомогательная функция `unread_key` реализует внутренний шаг бизнес-логики. Args: user_id: Идентификатор user. Returns: Строковое значение, сформированное функцией.
- `active_key(user_id: int) -> str`
  - Вспомогательная функция `active_key` реализует внутренний шаг бизнес-логики. Args: user_id: Идентификатор user. Returns: Строковое значение, сформированное функцией.
- `_normalize_room_ids(value: Any) -> list[int]`
  - Нормализует room ids к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Список типа list[int] с результатами операции.
- `_normalize_counts(value: Any) -> dict[str, int]`
  - Нормализует counts к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Словарь типа dict[str, int] с результатами операции.
- `_counts_to_room_ids(counts: dict[str, int]) -> list[int]`
  - Вспомогательная функция `_counts_to_room_ids` реализует внутренний шаг бизнес-логики. Args: counts: Параметр counts, используемый в логике функции. Returns: Список типа list[int] с данными результата.
- `_parse_positive_room_id(value: int | str | None) -> int | None`
  - Разбирает positive room id из входных данных с валидацией формата. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа int | None, сформированный в рамках обработки.
- `get_unread_room_ids(user_id: int) -> list[int]`
  - Возвращает unread room ids из текущего контекста или хранилища. Args: user_id: Идентификатор user, используемый для выборки данных. Returns: Список типа list[int] с результатами операции.
- `get_unread_state(user_id: int) -> dict[str, Any]`
  - Возвращает unread state из текущего контекста или хранилища. Args: user_id: Идентификатор user, используемый для выборки данных. Returns: Словарь типа dict[str, Any] с результатами операции.
- `mark_unread(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]`
  - Помечает unread новым состоянием. Args: user_id: Идентификатор user, используемый для выборки данных. room_id: Идентификатор room, используемый для выборки данных. ttl_seconds: Время жизни данных в кеше в секундах. Returns: Словарь типа dict[str, Any] с результатами операции.
- `mark_read(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]`
  - Помечает read новым состоянием. Args: user_id: Идентификатор user, используемый для выборки данных. room_id: Идентификатор room, используемый для выборки данных. ttl_seconds: Время жизни данных в кеше в секундах. Returns: Словарь типа dict[str, Any] с результатами операции.
- `set_active_room(user_id: int, room_id: int, conn_id: str, ttl_seconds: int) -> None`
  - Устанавливает active room с учетом текущих правил приложения. Args: user_id: Идентификатор user, используемый для выборки данных. room_id: Идентификатор room, используемый для выборки данных. conn_id: Идентификатор conn, используемый для выборки данных. ttl_seconds: Время жизни данных в кеше в секундах.
- `touch_active_room(user_id: int, conn_id: str, ttl_seconds: int) -> None`
  - Обновляет метку активности для active room. Args: user_id: Идентификатор user, используемый для выборки данных. conn_id: Идентификатор conn, используемый для выборки данных. ttl_seconds: Время жизни данных в кеше в секундах.
- `clear_active_room(user_id: int, conn_id: str | None=None) -> None`
  - Очищает active room и сбрасывает связанное состояние. Args: user_id: Идентификатор user, используемый для выборки данных. conn_id: Идентификатор conn, используемый для выборки данных.
- `is_room_active(user_id: int, room_id: int) -> bool`
  - Проверяет условие room active и возвращает логический результат. Args: user_id: Идентификатор user, используемый для выборки данных. room_id: Идентификатор room, используемый для выборки данных. Returns: Логическое значение результата проверки.

## `backend/friends/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/admin.py`

- Functions: 0
- Classes: 1

### Classes

- `FriendshipAdmin` : `admin.ModelAdmin`
  - Класс FriendshipAdmin настраивает поведение сущности в Django Admin.
  - Methods: 8
  - `from_user_id_value(self, obj: Friendship) -> int | None`
    - Формирует значение from user id value для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
  - `to_user_id_value(self, obj: Friendship) -> int | None`
    - Формирует значение to user id value для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
  - `_set_status(self, queryset, status: str) -> int`
    - Устанавливает status с учетом текущих правил приложения. Args: queryset: Набор записей, к которому применяются фильтры. status: HTTP-статус ответа, который будет возвращен клиенту. Returns: Целочисленное значение результата вычисления.
  - `mark_pending(self, request, queryset)`
    - Помечает pending новым состоянием. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. queryset: Набор записей, к которому применяются фильтры.
  - `mark_accepted(self, request, queryset)`
    - Помечает accepted новым состоянием. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. queryset: Набор записей, к которому применяются фильтры.
  - `mark_declined(self, request, queryset)`
    - Помечает declined новым состоянием. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. queryset: Набор записей, к которому применяются фильтры.
  - `mark_blocked(self, request, queryset)`
    - Помечает blocked новым состоянием. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. queryset: Набор записей, к которому применяются фильтры.
  - `make_mutual_accepted(self, request, queryset)`
    - Формирует значение make mutual accepted для отображения в админ-панели. Args: request: HTTP-запрос с контекстом пользователя и входными данными. queryset: Набор записей, к которому применяются фильтры.

## `backend/friends/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/application/errors.py`

- Description: Typed application errors for friend management use-cases.
- Functions: 0
- Classes: 4

### Classes

- `FriendServiceError` : `Exception`
  - Класс FriendServiceError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `__init__(self, message: str)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: message: Экземпляр сообщения для обработки.
- `FriendNotFoundError` : `FriendServiceError`
  - Класс FriendNotFoundError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `FriendForbiddenError` : `FriendServiceError`
  - Класс FriendForbiddenError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `FriendConflictError` : `FriendServiceError`
  - Класс FriendConflictError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/friends/application/friend_service.py`

- Description: Friend management use-cases.
- Functions: 16
- Classes: 0

### Functions

- `_ensure_authenticated(actor) -> None`
  - Гарантирует корректность состояния authenticated перед выполнением операции. Args: actor: Пользователь, инициирующий действие в системе.
- `_normalize_public_ref(raw: str) -> str`
  - Нормализует public ref к внутреннему формату приложения. Args: raw: Сырое значение из внешнего источника до нормализации. Returns: Строковое значение, сформированное функцией.
- `_friend_from_user_id(friendship: Friendship) -> int`
  - Вспомогательная функция `_friend_from_user_id` реализует внутренний шаг бизнес-логики. Args: friendship: Запись дружбы между пользователями. Returns: Целочисленный результат вычисления.
- `_friend_to_user_id(friendship: Friendship) -> int`
  - Вспомогательная функция `_friend_to_user_id` реализует внутренний шаг бизнес-логики. Args: friendship: Запись дружбы между пользователями. Returns: Целочисленный результат вычисления.
- `list_friends(actor) -> list`
  - Возвращает список friends, доступных в текущем контексте. Args: actor: Пользователь, инициирующий действие в системе. Returns: Список типа list с результатами операции.
- `list_incoming_requests(actor) -> list`
  - Возвращает список incoming requests, доступных в текущем контексте. Args: actor: Пользователь, инициирующий действие в системе. Returns: Список типа list с результатами операции.
- `list_outgoing_requests(actor) -> list`
  - Возвращает список outgoing requests, доступных в текущем контексте. Args: actor: Пользователь, инициирующий действие в системе. Returns: Список типа list с результатами операции.
- `list_blocked(actor) -> list`
  - Возвращает список blocked, доступных в текущем контексте. Args: actor: Пользователь, инициирующий действие в системе. Returns: Список типа list с результатами операции.
- `is_blocked_between(user_a, user_b) -> bool`
  - Проверяет условие blocked between и возвращает логический результат. Args: user_a: Данные user a, участвующие в обработке текущей операции. user_b: Данные user b, участвующие в обработке текущей операции. Returns: Логическое значение результата проверки.
- `send_request(actor, target_ref: str) -> Friendship`
  - Отправляет request целевому получателю. Args: actor: Пользователь, инициирующий действие. target_ref: Публичный референс целевого пользователя. Returns: Объект типа Friendship, сформированный в ходе выполнения.
- `accept_request(actor, friendship_id: int) -> Friendship`
  - Вспомогательная функция `accept_request` реализует внутренний шаг бизнес-логики. Args: actor: Пользователь, инициирующий действие. friendship_id: Идентификатор friendship. Returns: Объект типа Friendship, сформированный в ходе выполнения.
- `decline_request(actor, friendship_id: int) -> Friendship`
  - Вспомогательная функция `decline_request` реализует внутренний шаг бизнес-логики. Args: actor: Пользователь, инициирующий действие. friendship_id: Идентификатор friendship. Returns: Объект типа Friendship, сформированный в ходе выполнения.
- `cancel_outgoing_request(actor, friendship_id: int) -> Friendship`
  - Отменяет исходящий запрос запрос. Args: actor: Пользователь, инициирующий действие. friendship_id: Идентификатор friendship. Returns: Объект типа Friendship, сформированный в ходе выполнения.
- `remove_friend(actor, target_user_id: int) -> None`
  - Удаляет friend из целевого набора данных. Args: actor: Пользователь, инициирующий действие в системе. target_user_id: Идентификатор target user, используемый для выборки данных.
- `block_user(actor, target_ref: str) -> Friendship`
  - Блокирует пользователь. Args: actor: Пользователь, инициирующий действие. target_ref: Публичный референс целевого пользователя. Returns: Объект типа Friendship, сформированный в ходе выполнения.
- `unblock_user(actor, target_user_id: int) -> None`
  - Снимает блокировку с пользователь. Args: actor: Пользователь, инициирующий действие. target_user_id: Идентификатор целевого пользователя.

## `backend/friends/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `FriendsConfig` : `AppConfig`
  - Класс FriendsConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `ready(self)`
    - Инициализирует интеграции и сигналы при запуске приложения.

## `backend/friends/domain/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/domain/rules.py`

- Description: Pure domain rules for friendship logic.
- Functions: 5
- Classes: 0

### Functions

- `is_self_request(actor_id: int, target_id: int) -> bool`
  - Проверяет условие self request и возвращает логический результат. Args: actor_id: Идентификатор actor, используемый для выборки данных. target_id: Идентификатор target, используемый для выборки данных. Returns: Логическое значение результата проверки.
- `can_send_request(*, existing_outgoing_status: str | None, existing_incoming_status: str | None) -> tuple[bool, str]`
  - Проверяет условие send request и возвращает логический результат. Args: existing_outgoing_status: Текущий статус исходящей заявки дружбы. existing_incoming_status: Текущий статус входящей заявки дружбы. Returns: Кортеж типа tuple[bool, str] с результатами операции.
- `should_auto_accept(existing_incoming_status: str | None) -> bool`
  - Определяет, нужно ли выполнять действие auto accept. Args: existing_incoming_status: Текущий статус входящей заявки дружбы. Returns: Логическое значение результата проверки.
- `can_accept_request(*, request_to_user_id: int, actor_id: int) -> bool`
  - Проверяет условие accept request и возвращает логический результат. Args: request_to_user_id: Идентификатор request to user, используемый для выборки данных. actor_id: Идентификатор actor, используемый для выборки данных. Returns: Логическое значение результата проверки.
- `can_decline_request(*, request_to_user_id: int, actor_id: int) -> bool`
  - Проверяет условие decline request и возвращает логический результат. Args: request_to_user_id: Идентификатор request to user, используемый для выборки данных. actor_id: Идентификатор actor, используемый для выборки данных. Returns: Логическое значение результата проверки.

## `backend/friends/infrastructure/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/infrastructure/repositories.py`

- Description: ORM repositories for friendship queries.
- Functions: 9
- Classes: 0

### Functions

- `get_user_by_public_ref(public_ref: str)`
  - Возвращает user by public ref из текущего контекста или хранилища. Args: public_ref: Данные public ref, участвующие в обработке текущей операции. Returns: Функция не возвращает значение.
- `get_user_by_id(user_id: int)`
  - Возвращает user by id из текущего контекста или хранилища. Args: user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `get_friendship(from_user, to_user) -> Friendship | None`
  - Возвращает friendship из текущего контекста или хранилища. Args: from_user: Пользователь-инициатор действия или запроса дружбы. to_user: Целевой пользователь действия или запроса дружбы. Returns: Объект типа Friendship | None, сформированный в рамках обработки.
- `get_friendship_by_id(friendship_id: int) -> Friendship | None`
  - Возвращает friendship by id из текущего контекста или хранилища. Args: friendship_id: Идентификатор friendship, используемый для выборки данных. Returns: Объект типа Friendship | None, сформированный в рамках обработки.
- `list_friends_for_user(user) -> QuerySet`
  - Возвращает список friends for user, доступных в текущем контексте. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа QuerySet, сформированный в рамках обработки.
- `list_pending_incoming(user) -> QuerySet`
  - Возвращает список pending incoming, доступных в текущем контексте. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа QuerySet, сформированный в рамках обработки.
- `list_pending_outgoing(user) -> QuerySet`
  - Возвращает список pending outgoing, доступных в текущем контексте. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа QuerySet, сформированный в рамках обработки.
- `list_blocked_by_user(user) -> QuerySet`
  - Возвращает список blocked by user, доступных в текущем контексте. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа QuerySet, сформированный в рамках обработки.
- `delete_friendship_pair(user_a, user_b, *, status: str | None=None) -> int`
  - Удаляет friendship pair и выполняет сопутствующие действия. Args: user_a: Данные user a, участвующие в обработке текущей операции. user_b: Данные user b, участвующие в обработке текущей операции. status: HTTP-статус ответа, который будет возвращен клиенту. Returns: Целочисленное значение результата вычисления.

## `backend/friends/interfaces/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/interfaces/serializers.py`

- Description: Serializers for friend management HTTP API.
- Functions: 3
- Classes: 6

### Functions

- `_require_from_user_id(obj: Friendship) -> int`
  - Проверяет обязательное условие from user id перед продолжением операции. Args: obj: Объект доменной модели или ORM-сущность. Returns: Целочисленное значение результата вычисления.
- `_require_to_user_id(obj: Friendship) -> int`
  - Проверяет обязательное условие to user id перед продолжением операции. Args: obj: Объект доменной модели или ORM-сущность. Returns: Целочисленное значение результата вычисления.
- `_serialize_user_brief(user, request) -> dict`
  - Сериализует user brief в формат, пригодный для передачи клиенту. Args: user: Пользователь, для которого выполняется операция. request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Словарь типа dict с результатами операции.

### Classes

- `_UserBriefSerializer` : `serializers.Serializer`
  - Класс _UserBriefSerializer сериализует и валидирует данные API.
  - Methods: 0
- `FriendOutputSerializer` : `serializers.ModelSerializer`
  - Класс FriendOutputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
    - Возвращает user из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Словарь типа dict с результатами операции.
- `IncomingRequestOutputSerializer` : `serializers.ModelSerializer`
  - Класс IncomingRequestOutputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
    - Возвращает user из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Словарь типа dict с результатами операции.
- `OutgoingRequestOutputSerializer` : `serializers.ModelSerializer`
  - Класс OutgoingRequestOutputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
    - Возвращает user из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Словарь типа dict с результатами операции.
- `BlockedOutputSerializer` : `serializers.ModelSerializer`
  - Класс BlockedOutputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
    - Возвращает user из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Словарь типа dict с результатами операции.
- `PublicRefInputSerializer` : `serializers.Serializer`
  - Класс PublicRefInputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `validate(self, attrs)`
    - Проверяет входные данные и возвращает нормализованный результат. Args: attrs: Атрибуты после первичной валидации. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/friends/interfaces/urls.py`

- Description: URL routes for friend management API.
- Functions: 0
- Classes: 0

## `backend/friends/interfaces/views.py`

- Description: DRF views for friend management.
- Functions: 1
- Classes: 11

### Functions

- `_service_error_response(exc: FriendServiceError) -> Response`
  - Вспомогательная функция `_service_error_response` реализует внутренний шаг бизнес-логики. Args: exc: Параметр exc, используемый в логике функции. Returns: HTTP-ответ с результатом обработки.

### Classes

- `FriendListApiView` : `APIView`
  - Класс FriendListApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `get(self, request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `IncomingRequestsApiView` : `APIView`
  - Класс IncomingRequestsApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `get(self, request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `OutgoingRequestsApiView` : `APIView`
  - Класс OutgoingRequestsApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `get(self, request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `SendRequestApiView` : `GenericAPIView`
  - Класс SendRequestApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 2
  - `get(self, _request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: _request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
  - `post(self, request)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `AcceptRequestApiView` : `APIView`
  - Класс AcceptRequestApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request, friendship_id: int)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. friendship_id: Идентификатор friendship, используемый для выборки данных. Returns: Функция не возвращает значение.
- `DeclineRequestApiView` : `APIView`
  - Класс DeclineRequestApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request, friendship_id: int)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. friendship_id: Идентификатор friendship, используемый для выборки данных. Returns: Функция не возвращает значение.
- `CancelOutgoingRequestApiView` : `APIView`
  - Класс CancelOutgoingRequestApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `delete(self, request, friendship_id: int)`
    - Обрабатывает HTTP DELETE запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. friendship_id: Идентификатор friendship, используемый для выборки данных. Returns: Функция не возвращает значение.
- `RemoveFriendApiView` : `APIView`
  - Класс RemoveFriendApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `delete(self, request, user_id: int)`
    - Обрабатывает HTTP DELETE запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `BlockedListApiView` : `APIView`
  - Класс BlockedListApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `get(self, request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `BlockUserApiView` : `GenericAPIView`
  - Класс BlockUserApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 2
  - `get(self, _request)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: _request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
  - `post(self, request)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `UnblockUserApiView` : `APIView`
  - Класс UnblockUserApiView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `delete(self, request, user_id: int)`
    - Обрабатывает HTTP DELETE запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.

## `backend/friends/models.py`

- Description: Friendship model — one row per direction (A→B).
- Functions: 0
- Classes: 1

### Classes

- `Friendship` : `models.Model`
  - Модель Friendship описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/friends/signals.py`

- Functions: 2
- Classes: 0

### Functions

- `audit_friendship_save(sender, instance: Friendship, created: bool, **kwargs)`
  - Фиксирует friendship save в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. created: Флаг создания новой записи. **kwargs: Дополнительные именованные аргументы вызова.
- `audit_friendship_delete(sender, instance: Friendship, **kwargs)`
  - Фиксирует friendship delete в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. **kwargs: Дополнительные именованные аргументы вызова.

## `backend/friends/tests/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/tests/test_friends_api.py`

- Description: Tests for the friends management API.
- Functions: 1
- Classes: 6

### Functions

- `_assert_signed_media_url(url: str)`

### Classes

- `FriendsApiTestBase` : `TestCase`
  - Methods: 2
  - `setUp(self)`
  - `_login(self, user)`
- `SendRequestTests` : `FriendsApiTestBase`
  - Methods: 7
  - `test_send_request_creates_pending(self)`
  - `test_send_request_unauthenticated(self)`
  - `test_send_request_to_self(self)`
  - `test_send_request_to_nonexistent_user(self)`
  - `test_send_duplicate_request(self)`
  - `test_send_request_strips_at_sign(self)`
  - `test_auto_accept_mutual_request(self)`
- `AcceptDeclineTests` : `FriendsApiTestBase`
  - Methods: 9
  - `test_accept_request(self)`
  - `test_accept_by_wrong_user(self)`
  - `test_accept_nonexistent_request(self)`
  - `test_decline_request(self)`
  - `test_decline_by_wrong_user(self)`
  - `test_re_request_after_decline(self)`
  - `test_cancel_outgoing_request(self)`
  - `test_cancel_outgoing_request_by_other_user_forbidden(self)`
  - `test_cancel_outgoing_request_returns_not_found_for_non_pending(self)`
- `ListTests` : `FriendsApiTestBase`
  - Methods: 6
  - `test_list_friends(self)`
  - `test_list_friends_excludes_pending(self)`
  - `test_list_incoming_requests(self)`
  - `test_list_outgoing_requests(self)`
  - `test_list_friends_unauthenticated(self)`
  - `test_list_blocked_includes_avatar_fields(self)`
- `RemoveFriendTests` : `FriendsApiTestBase`
  - Methods: 5
  - `test_remove_friend(self)`
  - `test_remove_nonexistent_friend(self)`
  - `test_remove_nonexistent_user(self)`
  - `test_remove_friend_does_not_delete_pending_relation(self)`
  - `test_remove_friend_does_not_delete_blocked_relation(self)`
- `BlockUnblockTests` : `FriendsApiTestBase`
  - Methods: 7
  - `test_block_user(self)`
  - `test_block_removes_reverse_friendship(self)`
  - `test_block_self(self)`
  - `test_unblock_user(self)`
  - `test_unblock_when_not_blocked(self)`
  - `test_cannot_send_request_to_blocked_user(self)`
  - `test_cannot_send_request_to_user_who_blocked_you(self)`

## `backend/friends/tests/test_utils_and_models.py`

- Functions: 0
- Classes: 2

### Classes

- `FriendsUtilsTests` : `TestCase`
  - Methods: 4
  - `test_get_from_user_id_prefers_direct_id(self)`
  - `test_get_from_user_id_falls_back_to_related_pk_or_none(self)`
  - `test_get_to_user_id_prefers_direct_id(self)`
  - `test_get_to_user_id_falls_back_to_related_pk_or_none(self)`
- `FriendshipModelStringTests` : `TestCase`
  - Methods: 2
  - `test_str_uses_fk_ids_when_available(self)`
  - `test_str_falls_back_to_placeholders_when_relations_missing(self)`

## `backend/friends/utils.py`

- Description: Shared helpers for the friends app.
- Functions: 2
- Classes: 0

### Functions

- `get_from_user_id(obj: Friendship) -> int | None`
  - Возвращает from user id из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Объект типа int | None, сформированный в рамках обработки.
- `get_to_user_id(obj: Friendship) -> int | None`
  - Возвращает to user id из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Объект типа int | None, сформированный в рамках обработки.

## `backend/groups/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/application/invite_service.py`

- Description: Invite link management for groups.
- Functions: 5
- Classes: 0

### Functions

- `create_invite(actor, room_id: int, *, name: str='', expires_in_seconds: int | None=None, max_uses: int=0) -> InviteLink`
  - Создает invite и возвращает созданный объект. Args: actor: Пользователь, инициирующий действие. room_id: Идентификатор комнаты. name: Имя сущности или параметра. expires_in_seconds: Параметр expires in seconds, используемый в логике функции. max_uses: Параметр max uses, используемый в логике функции. Returns: Объект типа InviteLink, сформированный в ходе выполнения.
- `list_invites(actor, room_id: int) -> list[InviteLink]`
  - Возвращает список invites, доступных в текущем контексте. Args: actor: Пользователь, инициирующий действие. room_id: Идентификатор room. Returns: Список типа list[InviteLink] с результатами операции.
- `revoke_invite(actor, room_id: int, invite_code: str) -> None`
  - Отзывает invite и аннулирует дальнейшее использование. Args: actor: Пользователь, инициирующий действие. room_id: Идентификатор комнаты. invite_code: Код приглашения в группу.
- `get_invite_info(invite_code: str) -> dict`
  - Возвращает invite info из текущего контекста или хранилища. Args: invite_code: Код приглашения в группу. Returns: Словарь типа dict с данными результата.
- `join_via_invite(actor, invite_code: str) -> dict`
  - Добавляет участника или объект в via invite. Args: actor: Пользователь, инициирующий действие. invite_code: Код приглашения в группу. Returns: Словарь типа dict с данными результата.

## `backend/groups/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `GroupsConfig` : `AppConfig`
  - Класс GroupsConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/groups/domain/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/infrastructure/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/infrastructure/models.py`

- Description: Group-specific models: invite links, join requests, pinned messages.
- Functions: 0
- Classes: 3

### Classes

- `InviteLink` : `models.Model`
  - Модель InviteLink описывает структуру и поведение данных в приложении.
  - Methods: 2
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
  - `is_expired(self) -> bool`
    - Проверяет условие expired и возвращает логический результат. Returns: Логическое значение результата проверки.
- `JoinRequest` : `models.Model`
  - Модель JoinRequest описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `PinnedMessage` : `models.Model`
  - Модель PinnedMessage описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/groups/interfaces/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/interfaces/serializers.py`

- Description: DRF serializers for the groups API.
- Functions: 0
- Classes: 15

### Classes

- `GroupCreateInputSerializer` : `serializers.Serializer`
  - Класс GroupCreateInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `GroupUpdateInputSerializer` : `serializers.Serializer`
  - Класс GroupUpdateInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `GroupOutputSerializer` : `serializers.Serializer`
  - Класс GroupOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `GroupListItemSerializer` : `serializers.Serializer`
  - Класс GroupListItemSerializer сериализует и валидирует данные API.
  - Methods: 0
- `InviteCreateInputSerializer` : `serializers.Serializer`
  - Класс InviteCreateInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `InviteOutputSerializer` : `serializers.Serializer`
  - Класс InviteOutputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `get_createdBy(self, obj)`
    - Возвращает created by из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
- `InvitePreviewSerializer` : `serializers.Serializer`
  - Класс InvitePreviewSerializer сериализует и валидирует данные API.
  - Methods: 0
- `MemberOutputSerializer` : `serializers.Serializer`
  - Класс MemberOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `BannedMemberSerializer` : `serializers.Serializer`
  - Класс BannedMemberSerializer сериализует и валидирует данные API.
  - Methods: 0
- `BanInputSerializer` : `serializers.Serializer`
  - Класс BanInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `MuteInputSerializer` : `serializers.Serializer`
  - Класс MuteInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `JoinRequestOutputSerializer` : `serializers.Serializer`
  - Класс JoinRequestOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `PinInputSerializer` : `serializers.Serializer`
  - Класс PinInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `PinOutputSerializer` : `serializers.Serializer`
  - Класс PinOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `TransferOwnershipInputSerializer` : `serializers.Serializer`
  - Класс TransferOwnershipInputSerializer сериализует и валидирует данные API.
  - Methods: 0

## `backend/groups/interfaces/views.py`

- Description: REST API views for the groups subsystem.
- Functions: 27
- Classes: 8

### Functions

- `_error(msg: str, code: int=400) -> Response`
  - Вспомогательная функция `_error` реализует внутренний шаг бизнес-логики. Args: msg: Параметр msg, используемый в логике функции. code: Параметр code, используемый в логике функции. Returns: HTTP-ответ с результатом обработки.
- `_validated_data(serializer: Any) -> dict[str, Any]`
  - Выполняет вспомогательную обработку для validated data. Args: serializer: Сериализатор с входными или валидированными данными. Returns: Словарь типа dict[str, Any] с результатами операции.
- `_parse_positive_int(raw_value: str | None, param_name: str) -> int`
  - Разбирает positive int из входных данных с валидацией формата. Args: raw_value: Исходное значение параметра до преобразования и валидации. param_name: Имя входного параметра, участвующего в проверке. Returns: Целочисленное значение результата вычисления.
- `_handle_group_errors(func)`
  - Обрабатывает событие group errors и выполняет связанную бизнес-логику. Args: func: Функция, которую оборачивает текущий декоратор. Returns: Функция не возвращает значение.
- `create_group(request)`
  - Создает group и возвращает созданную сущность. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `list_public_groups(request)`
  - Возвращает список public groups, доступных в текущем контексте. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `list_my_groups(request)`
  - Возвращает список my groups, доступных в текущем контексте. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `group_detail(request, room_id)`
  - Вспомогательная функция `group_detail` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `join_group(request, room_id)`
  - Добавляет участника или объект в group. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `leave_group(request, room_id)`
  - Удаляет участника или объект из group. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `list_members(request, room_id)`
  - Возвращает список members, доступных в текущем контексте. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `kick_member(request, room_id, user_id)`
  - Исключает member с учетом проверок полномочий. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `ban_member(request, room_id, user_id)`
  - Блокирует member в рамках текущего контекста. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `unban_member(request, room_id, user_id)`
  - Снимает блокировку с member. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `mute_member(request, room_id, user_id)`
  - Отключает активность member на заданный период. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `unmute_member(request, room_id, user_id)`
  - Возвращает активность member после снятия ограничения. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `list_banned(request, room_id)`
  - Возвращает список banned, доступных в текущем контексте. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `group_invites(request, room_id)`
  - Вспомогательная функция `group_invites` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `revoke_invite(request, room_id, code)`
  - Отзывает invite и аннулирует дальнейшее использование. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. code: Код операции, приглашения или ошибки. Returns: Функция не возвращает значение.
- `invite_preview(request, code)`
  - Вспомогательная функция `invite_preview` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. code: Параметр code, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `join_via_invite(request, code)`
  - Добавляет участника или объект в via invite. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. code: Код операции, приглашения или ошибки. Returns: Функция не возвращает значение.
- `list_join_requests(request, room_id)`
  - Возвращает список join requests, доступных в текущем контексте. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `approve_join_request(request, room_id, request_id)`
  - Подтверждает join request и применяет изменения. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. request_id: Идентификатор request, используемый для выборки данных. Returns: Функция не возвращает значение.
- `reject_join_request(request, room_id, request_id)`
  - Отклоняет join request без применения изменений. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. request_id: Идентификатор request, используемый для выборки данных. Returns: Функция не возвращает значение.
- `group_pins(request, room_id)`
  - Вспомогательная функция `group_pins` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `unpin_message(request, room_id, message_id)`
  - Снимает закрепление с message. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. message_id: Идентификатор message, используемый для выборки данных. Returns: Функция не возвращает значение.
- `transfer_ownership(request, room_id)`
  - Передает владение. Args: request: HTTP-запрос с контекстом пользователя и входными данными. room_id: Идентификатор комнаты. Returns: Результат вычислений, сформированный в ходе выполнения функции.

### Classes

- `_HandledGroupAPIView` : `GenericAPIView`
  - Класс _HandledGroupAPIView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `_execute(self, handler)`
    - Обрабатывает шаг execute в HTTP API. Args: handler: Параметр handler, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `GroupCreateInteractiveView` : `_HandledGroupAPIView`
  - Класс GroupCreateInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Функция не возвращает значение.
- `GroupDetailInteractiveView` : `_HandledGroupAPIView`
  - Класс GroupDetailInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 3
  - `get(self, request, room_id)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
  - `patch(self, request, room_id)`
    - Обрабатывает HTTP PATCH запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
  - `delete(self, request, room_id)`
    - Обрабатывает HTTP DELETE запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `BanMemberInteractiveView` : `_HandledGroupAPIView`
  - Класс BanMemberInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request, room_id, user_id)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `MuteMemberInteractiveView` : `_HandledGroupAPIView`
  - Класс MuteMemberInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request, room_id, user_id)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.
- `GroupInvitesInteractiveView` : `_HandledGroupAPIView`
  - Класс GroupInvitesInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 2
  - `get(self, request, room_id)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
  - `post(self, request, room_id)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `GroupPinsInteractiveView` : `_HandledGroupAPIView`
  - Класс GroupPinsInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 2
  - `get(self, request, room_id)`
    - Обрабатывает HTTP GET запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
  - `post(self, request, room_id)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.
- `TransferOwnershipInteractiveView` : `_HandledGroupAPIView`
  - Класс TransferOwnershipInteractiveView реализует HTTP-обработчики для API-слоя.
  - Methods: 1
  - `post(self, request, room_id)`
    - Обрабатывает HTTP POST запрос в рамках текущего представления. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room_id: Идентификатор room, используемый для выборки данных. Returns: Функция не возвращает значение.

## `backend/groups/tests/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/tests/_typing.py`

- Description: Typing helpers for groups API tests.
- Functions: 0
- Classes: 1

### Classes

- `TypedAPIClient` : `APIClient`
  - APIClient that returns Any for request methods to satisfy static typing.
  - Methods: 4
  - `get(self, *args: Any, **kwargs: Any) -> Any`
  - `post(self, *args: Any, **kwargs: Any) -> Any`
  - `patch(self, *args: Any, **kwargs: Any) -> Any`
  - `delete(self, *args: Any, **kwargs: Any) -> Any`

## `backend/groups/tests/test_domain_rules.py`

- Functions: 0
- Classes: 1

### Classes

- `GroupDomainRulesTests` : `SimpleTestCase`
  - Methods: 5
  - `test_generate_invite_code_uses_configured_length(self)`
  - `test_validate_group_name(self)`
  - `test_validate_group_username(self)`
  - `test_validate_description_and_slow_mode(self)`
  - `test_ensure_is_group(self)`

## `backend/groups/tests/test_group_api.py`

- Description: Tests for group CRUD API endpoints.
- Functions: 1
- Classes: 6

### Functions

- `_assert_signed_media_url(url: str)`

### Classes

- `APITestCase` : `TestCase`
  - Methods: 0
- `TestCreateGroup` : `APITestCase`
  - Methods: 6
  - `setUp(self)`
  - `test_create_private_group(self)`
  - `test_create_public_group_without_username_is_rejected(self)`
  - `test_create_public_group_with_username(self)`
  - `test_create_group_unauthenticated(self)`
  - `test_duplicate_username_rejected(self)`
- `TestGroupDetail` : `APITestCase`
  - Methods: 12
  - `setUp(self)`
  - `test_get_public_group_info_unauthenticated(self)`
  - `test_update_group(self)`
  - `test_update_public_group_rejects_empty_username(self)`
  - `test_update_group_rejects_duplicate_username(self)`
  - `test_update_group_forbidden_for_non_admin(self)`
  - `test_delete_group(self)`
  - `test_delete_group_forbidden_for_non_owner(self)`
  - `test_superuser_can_update_and_delete_group_without_membership(self)`
  - `test_update_group_avatar_with_multipart_patch(self)`
  - `test_update_group_avatar_crop_persists(self)`
  - `test_remove_group_avatar_via_avatar_action(self)`
- `TestPublicGroupList` : `APITestCase`
  - Methods: 4
  - `setUp(self)`
  - `test_list_public_groups(self)`
  - `test_search_public_groups(self)`
  - `test_public_groups_cursor_pagination_by_id(self)`
- `TestMyGroupList` : `APITestCase`
  - Methods: 6
  - `setUp(self)`
  - `test_list_my_groups(self)`
  - `test_search_my_groups(self)`
  - `test_my_groups_requires_auth(self)`
  - `test_superuser_lists_all_groups_in_my_groups_endpoint(self)`
  - `test_my_groups_cursor_pagination_by_id(self)`
- `TestPrivateGroupAccess` : `APITestCase`
  - Methods: 3
  - `setUp(self)`
  - `test_private_group_hidden_from_non_member(self)`
  - `test_private_group_hidden_from_unauthenticated(self)`

## `backend/groups/tests/test_invite_api.py`

- Description: Tests for invite link API endpoints.
- Functions: 0
- Classes: 2

### Classes

- `APITestCase` : `TestCase`
  - Methods: 0
- `TestInviteLinks` : `APITestCase`
  - Methods: 10
  - `setUp(self)`
  - `test_create_invite(self)`
  - `test_create_invite_with_expiry(self)`
  - `test_join_via_invite(self)`
  - `test_invite_preview(self)`
  - `test_revoke_invite(self)`
  - `test_expired_invite_rejected(self)`
  - `test_max_uses_enforced(self)`
  - `test_banned_user_cannot_join(self)`
  - `test_list_invites_requires_manage_invites(self)`

## `backend/groups/tests/test_member_api.py`

- Description: Tests for group member management API endpoints.
- Functions: 2
- Classes: 3

### Functions

- `_assert_signed_media_url(url: str)`
- `_create_group_with_member(client: TypedAPIClient, owner, member) -> int`
  - Helper: create group, invite link, join via link, return room id.

### Classes

- `APITestCase` : `TestCase`
  - Methods: 0
- `TestJoinLeave` : `APITestCase`
  - Methods: 5
  - `setUp(self)`
  - `test_join_public_group(self)`
  - `test_join_private_group_rejected(self)`
  - `test_leave_group(self)`
  - `test_owner_cannot_leave(self)`
- `TestKickBanMute` : `APITestCase`
  - Methods: 19
  - `setUp(self)`
  - `test_kick_member(self)`
  - `test_kick_requires_permission(self)`
  - `test_kick_self_returns_400(self)`
  - `test_ban_member(self)`
  - `test_ban_self_returns_400(self)`
  - `test_unban_member(self)`
  - `test_member_can_rejoin_after_unban_via_invite(self)`
  - `test_kicked_member_loses_access_to_members_api(self)`
  - `test_banned_member_loses_access_to_members_api(self)`
  - `test_mute_member(self)`
  - `test_mute_self_returns_400(self)`
  - `test_unmute_member(self)`
  - `test_unmute_self_returns_400(self)`
  - `test_list_members(self)`
  - `test_list_members_cursor_pagination_by_id(self)`
  - `test_list_banned(self)`
  - `test_hierarchy_prevents_kicking_higher_role(self)`
    - A member with Admin role should not be kickable by a Moderator.
  - `test_superuser_bypasses_hierarchy_for_kick_member(self)`

## `backend/groups/tests/test_permissions.py`

- Description: Tests for group permission resolution including mute.
- Functions: 0
- Classes: 2

### Classes

- `TestGroupPermissions` : `TestCase`
  - Methods: 8
  - `setUp(self)`
  - `test_owner_has_administrator(self)`
  - `test_member_can_read_write(self)`
  - `test_outsider_has_no_access_to_private_group(self)`
  - `test_unauthenticated_has_no_access_to_private_group(self)`
  - `test_muted_member_cannot_send(self)`
  - `test_expired_mute_allows_send(self)`
  - `test_banned_member_has_no_permissions(self)`
- `TestPublicGroupPermissions` : `TestCase`
  - Methods: 3
  - `setUp(self)`
  - `test_unauthenticated_can_read_public_group(self)`
  - `test_outsider_can_only_read_before_join(self)`

## `backend/groups/tests/test_pin_api.py`

- Description: Tests for pinned messages and ownership transfer API endpoints.
- Functions: 1
- Classes: 3

### Functions

- `_setup_group_with_message(client: TypedAPIClient, owner) -> tuple[int, int]`
  - Create a group and a message inside it, return (room_id, message_id).

### Classes

- `APITestCase` : `TestCase`
  - Methods: 0
- `TestPinnedMessages` : `APITestCase`
  - Methods: 6
  - `setUp(self)`
  - `test_pin_message(self)`
  - `test_list_pinned(self)`
  - `test_unpin_message(self)`
  - `test_pin_requires_permission(self)`
  - `test_pin_nonexistent_message(self)`
- `TestOwnershipTransfer` : `APITestCase`
  - Methods: 6
  - `setUp(self)`
  - `test_transfer_ownership(self)`
  - `test_transfer_to_self_fails(self)`
  - `test_non_owner_cannot_transfer(self)`
  - `test_owner_can_leave_after_transfer(self)`
  - `test_superuser_can_transfer_ownership_without_membership(self)`

## `backend/manage.py`

- Description: Модуль manage реализует прикладную логику подсистемы backend.
- Functions: 1
- Classes: 0

### Functions

- `main()`
  - Запускает точку входа для выполнения команды.

## `backend/media/chat_attachments/2026/03/build_defense_deck.py`

- Functions: 23
- Classes: 1

### Functions

- `rgb(color: tuple[int, int, int]) -> RGBColor`
- `rgbf(color: tuple[int, int, int]) -> tuple[float, float, float]`
- `_clamp(value: float, minimum: float, maximum: float) -> float`
- `_project_payload(index: int, payload: dict[str, Any]) -> dict[str, Any]`
- `write_diagram_sources() -> None`
- `_ppt_textbox(slide, x: float, y: float, w: float, h: float, text: str, *, size: int, bold: bool, color: tuple[int, int, int], align: PP_ALIGN=PP_ALIGN.LEFT, fit: bool=False) -> None`
- `_ppt_base(slide, idx: int, title: str) -> None`
- `_ppt_card(slide, x: float, y: float, w: float, h: float, text: str, *, fill: tuple[int, int, int], stroke: tuple[int, int, int], size: int=12) -> None`
- `_ppt_add_title(prs: Presentation, idx: int, payload: dict[str, Any]) -> None`
- `_ppt_add_text(prs: Presentation, idx: int, payload: dict[str, Any]) -> None`
- `_ppt_draw_diagram(slide, spec: dict[str, Any]) -> None`
- `_ppt_add_diagram(prs: Presentation, idx: int, payload: dict[str, Any]) -> None`
- `build_pptx() -> None`
- `pick_font(candidates: list[str]) -> str | None`
- `_pdf_text(page: fitz.Page, rect: fitz.Rect, text: str, *, size: int, bold: bool, color: tuple[int, int, int], align: int=0) -> None`
- `_pdf_base(page: fitz.Page, idx: int, title: str, w: float, h: float) -> None`
- `_pdf_card(page: fitz.Page, x: float, y: float, ww: float, hh: float, text: str, *, fill: tuple[int, int, int], stroke: tuple[int, int, int], size: int=10) -> None`
- `_pdf_add_title(doc: fitz.Document, idx: int, payload: dict[str, Any], w: float, h: float) -> None`
- `_pdf_add_text(doc: fitz.Document, idx: int, payload: dict[str, Any], w: float, h: float) -> None`
- `_pdf_add_diagram(doc: fitz.Document, idx: int, payload: dict[str, Any], w: float, h: float) -> None`
- `build_pdf() -> None`
- `write_script() -> None`
- `main() -> None`

### Classes

- `Style`
  - Methods: 0

## `backend/messages/__init__.py`

- Functions: 0
- Classes: 0

## `backend/messages/admin.py`

- Functions: 0
- Classes: 1

### Classes

- `MessageAdmin` : `admin.ModelAdmin`
  - Класс MessageAdmin настраивает поведение сущности в Django Admin.
  - Methods: 1
  - `short_message(self, obj)`
    - Формирует краткое представление message. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/messages/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `MessagesConfig` : `AppConfig`
  - Класс MessagesConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/messages/models.py`

- Functions: 0
- Classes: 5

### Classes

- `Message` : `models.Model`
  - Модель Message описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `Reaction` : `models.Model`
  - Модель Reaction описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `MessageAttachment` : `models.Model`
  - Модель MessageAttachment описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `MessageReadState` : `models.Model`
  - Модель MessageReadState описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `MessageReadReceipt` : `models.Model`
  - Фиксирует точное время прочтения конкретного сообщения пользователем.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/messages/serializers.py`

- Functions: 0
- Classes: 4

### Classes

- `AttachmentSerializer` : `serializers.ModelSerializer`
  - Класс AttachmentSerializer сериализует и валидирует данные API.
  - Methods: 3
  - `_build_url(self, field_file, obj)`
    - Формирует url для дальнейшего использования в потоке обработки. Args: field_file: Объект файлового поля модели или формы. obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_url(self, obj)`
    - Возвращает url из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_thumbnailUrl(self, obj)`
    - Возвращает thumbnail url из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
- `MessageSerializer` : `serializers.ModelSerializer`
  - Класс MessageSerializer сериализует и валидирует данные API.
  - Methods: 7
  - `get_profilePic(self, obj)`
    - Возвращает profile pic из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_publicRef(self, obj)`
    - Возвращает public ref из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_displayName(self, obj)`
    - Возвращает display name из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_avatarCrop(self, obj)`
    - Возвращает avatar crop из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_replyTo(self, obj)`
    - Возвращает reply to из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `get_reactions(self, obj)`
    - Возвращает reactions из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `to_representation(self, instance)`
    - Преобразует объект во внешнее представление для API. Args: instance: Экземпляр модели или доменного объекта. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `MessageCreateSerializer` : `serializers.Serializer`
  - Класс MessageCreateSerializer сериализует и валидирует данные API.
  - Methods: 0
- `MessagePaginationSerializer` : `serializers.Serializer`
  - Класс MessagePaginationSerializer сериализует и валидирует данные API.
  - Methods: 0

## `backend/messages/thumbnail.py`

- Description: Thumbnail generation for chat image attachments.
- Functions: 1
- Classes: 0

### Functions

- `generate_thumbnail(source_field) -> dict | None`
  - Генерирует thumbnail по заданным правилам. Args: source_field: Параметр source field, используемый в логике функции. Returns: Словарь типа dict | None с данными результата.

## `backend/presence/__init__.py`

- Functions: 0
- Classes: 0

## `backend/presence/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `PresenceConfig` : `AppConfig`
  - Класс PresenceConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/presence/constants.py`

- Description: Presence subsystem constants.
- Functions: 0
- Classes: 0

## `backend/presence/consumers.py`

- Description: WebSocket consumer for user online presence tracking.
- Functions: 2
- Classes: 1

### Functions

- `_to_async(func: Callable[..., T]) -> Callable[..., Awaitable[T]]`
  - Вспомогательная функция `_to_async` реализует внутренний шаг бизнес-логики. Args: func: Параметр func, используемый в логике функции. Returns: Объект типа Callable[..., Awaitable[T]], сформированный в ходе выполнения.
- `_ws_connect_rate_limited(scope, endpoint: str) -> bool`
  - Выполняет вспомогательную обработку для ws connect rate limited. Args: scope: ASGI-scope с метаданными соединения. endpoint: Идентификатор API/WS endpoint для применения правил. Returns: Логическое значение результата проверки.

### Classes

- `PresenceConsumer` : `AsyncWebsocketConsumer`
  - Класс PresenceConsumer обрабатывает WebSocket-события и сообщения.
  - Methods: 28
  - `connect(self)`
    - Устанавливает соединение и выполняет проверки доступа.
  - `disconnect(self, code)`
    - Корректно закрывает соединение и освобождает ресурсы. Args: code: Код ошибки или состояния.
  - `receive(self, text_data=None, bytes_data=None)`
    - Принимает входящее сообщение и маршрутизирует его обработку. Args: text_data: Параметр text data, используемый в логике функции. bytes_data: Параметр bytes data, используемый в логике функции.
  - `_broadcast(self)`
    - Выполняет вспомогательную обработку для broadcast.
  - `presence_update(self, event)`
    - Обрабатывает WebSocket-событие presence update. Args: event: Событие для логирования или трансляции.
  - `_heartbeat(self)`
    - Выполняет вспомогательную обработку для heartbeat.
  - `_idle_watchdog(self)`
    - Выполняет вспомогательную обработку для idle watchdog.
  - `_normalize_presence_value(value: object) -> str`
    - Нормализует presence value к внутреннему формату приложения. Args: value: Входное значение для проверки или преобразования. Returns: Строковое значение, сформированное функцией.
  - `_coerce_presence_int(value: object, default: int=0) -> int`
    - Преобразует presence int к допустимому типу или формату. Args: value: Входное значение для проверки или преобразования. default: Значение по умолчанию, применяемое при отсутствии пользовательского ввода. Returns: Целочисленное значение результата вычисления.
  - `_resolve_presence_user_identity(self, user: Any) -> tuple[str, str, str]`
    - Определяет presence user identity на основе доступного контекста. Args: user: Пользователь, для которого выполняется операция. Returns: Кортеж типа tuple[str, str, str] с результатами операции.
  - `_resolve_presence_entry(data: dict[str, dict[str, object]], *, key: str, username: str) -> tuple[str, dict[str, object] | None]`
    - Определяет presence entry на основе доступного контекста. Args: data: Словарь входных данных для обработки. key: Ключ в хранилище состояния или словаре промежуточных данных. username: Публичное имя пользователя, используемое в событиях и ответах. Returns: Кортеж типа tuple[str, dict[str, object] | None] с результатами операции.
  - `_add_user_sync(self, user: Any) -> None`
    - Выполняет вспомогательную обработку для add user sync. Args: user: Пользователь, для которого выполняется операция.
  - `_add_user(self, user: Any) -> None`
    - Выполняет вспомогательную обработку для add user. Args: user: Пользователь, для которого выполняется операция.
  - `_remove_user_sync(self, user: Any, graceful: bool=False) -> None`
    - Удаляет user sync из целевого набора данных. Args: user: Пользователь, для которого выполняется операция. graceful: Флаг штатного завершения соединения без ошибки.
  - `_remove_user(self, user: Any, graceful: bool=False) -> None`
    - Удаляет user из целевого набора данных. Args: user: Пользователь, для которого выполняется операция. graceful: Флаг штатного завершения соединения без ошибки.
  - `_get_online_sync(self) -> list[dict[str, object]]`
    - Возвращает online sync из текущего контекста или хранилища. Returns: Список типа list[dict[str, object]] с результатами операции.
  - `_get_online(self) -> list[dict[str, object]]`
    - Возвращает online из текущего контекста или хранилища. Returns: Список типа list[dict[str, object]] с результатами операции.
  - `_add_guest_sync(self, ip: str | None) -> None`
    - Добавляет guest sync в целевую коллекцию. Args: ip: IP-адрес клиента.
  - `_add_guest(self, ip: str | None) -> None`
    - Добавляет guest в целевую коллекцию. Args: ip: IP-адрес клиента.
  - `_remove_guest_sync(self, ip: str | None, graceful: bool=False) -> None`
    - Удаляет guest sync из целевого набора данных. Args: ip: IP-адрес клиента или узла, выполняющего запрос. graceful: Флаг штатного завершения соединения без ошибки.
  - `_remove_guest(self, ip: str | None, graceful: bool=False) -> None`
    - Удаляет guest из целевого набора данных. Args: ip: IP-адрес клиента или узла, выполняющего запрос. graceful: Флаг штатного завершения соединения без ошибки.
  - `_get_guest_count_sync(self) -> int`
    - Возвращает guest count sync из текущего контекста или хранилища. Returns: Целочисленное значение результата вычисления.
  - `_get_guest_count(self) -> int`
    - Возвращает guest count из текущего контекста или хранилища. Returns: Целочисленное значение результата вычисления.
  - `_touch_user_sync(self, user: Any) -> None`
    - Обновляет метку активности для user sync. Args: user: Пользователь, для которого выполняется операция.
  - `_touch_user(self, user: Any) -> None`
    - Обновляет метку активности для user. Args: user: Пользователь, для которого выполняется операция.
  - `_touch_guest_sync(self, ip: str | None) -> None`
    - Обновляет метку активности для guest sync. Args: ip: IP-адрес клиента или узла, выполняющего запрос.
  - `_touch_guest(self, ip: str | None) -> None`
    - Обновляет метку активности для guest. Args: ip: IP-адрес клиента или узла, выполняющего запрос.
  - `_get_guest_session_key(self) -> str | None`
    - Возвращает guest session key из текущего контекста или хранилища. Returns: Объект типа str | None, сформированный в рамках обработки.

## `backend/presence/routing.py`

- Description: WebSocket routing for presence consumers.
- Functions: 0
- Classes: 0

## `backend/roles/__init__.py`

- Functions: 0
- Classes: 0

## `backend/roles/access.py`

- Description: Backward-compatible facade for permission checks.
- Functions: 0
- Classes: 0

## `backend/roles/admin.py`

- Functions: 1
- Classes: 3

### Functions

- `_permission_flags(mask: int) -> str`
  - Вспомогательная функция `_permission_flags` реализует внутренний шаг бизнес-логики. Args: mask: Параметр mask, используемый в логике функции. Returns: Строковое значение, сформированное функцией.

### Classes

- `RoleAdmin` : `admin.ModelAdmin`
  - Класс RoleAdmin настраивает поведение сущности в Django Admin.
  - Methods: 1
  - `permission_flags(self, obj: Role) -> str`
    - Формирует значение permission flags для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `MembershipAdmin` : `admin.ModelAdmin`
  - Класс MembershipAdmin настраивает поведение сущности в Django Admin.
  - Methods: 1
  - `role_names(self, obj: Membership) -> str`
    - Формирует значение role names для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `PermissionOverrideAdmin` : `admin.ModelAdmin`
  - Класс PermissionOverrideAdmin настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `allow_flags(self, obj: PermissionOverride) -> str`
    - Формирует значение allow flags для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
  - `deny_flags(self, obj: PermissionOverride) -> str`
    - Формирует значение deny flags для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Строковое значение, сформированное функцией.

## `backend/roles/application/__init__.py`

- Description: Application layer for roles app.
- Functions: 0
- Classes: 0

## `backend/roles/application/errors.py`

- Description: Typed application errors for role management use-cases.
- Functions: 0
- Classes: 4

### Classes

- `RoleServiceError` : `Exception`
  - Класс RoleServiceError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `__init__(self, message: str)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: message: Экземпляр сообщения для обработки.
- `RoleNotFoundError` : `RoleServiceError`
  - Класс RoleNotFoundError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `RoleForbiddenError` : `RoleServiceError`
  - Класс RoleForbiddenError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `RoleConflictError` : `RoleServiceError`
  - Класс RoleConflictError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/roles/application/management_service.py`

- Description: Role, membership and override management use-cases.
- Functions: 27
- Classes: 1

### Functions

- `_audit_role_denied(room: Room | None, actor, reason: str) -> None`
  - Фиксирует role denied в системе аудита. Args: room: Комната, в контексте которой выполняется операция. actor: Пользователь, инициирующий действие. reason: Причина административного действия.
- `_load_room_or_raise(room_id: int) -> Room`
  - Загружает room or raise из хранилища с необходимыми проверками. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа Room, сформированный в рамках обработки.
- `_ensure_authenticated(actor) -> None`
  - Гарантирует корректность состояния authenticated перед выполнением операции. Args: actor: Пользователь, инициирующий действие в системе.
- `_ensure_manage_roles(room: Room, actor) -> ActorContext`
  - Гарантирует корректность состояния manage roles перед выполнением операции. Args: room: Экземпляр комнаты, над которой выполняется действие. actor: Пользователь, инициирующий действие в системе. Returns: Объект типа ActorContext, сформированный в рамках обработки.
- `_ensure_not_direct(room: Room) -> None`
  - Гарантирует корректность состояния not direct перед выполнением операции. Args: room: Экземпляр комнаты, над которой выполняется действие.
- `_ensure_manage_target_position(actor_context: ActorContext, *, target_position: int) -> None`
  - Гарантирует корректность состояния manage target position перед выполнением операции. Args: actor_context: Контекст полномочий пользователя, выполняющего изменение. target_position: Позиция роли целевого пользователя или объекта.
- `_ensure_permissions_subset(actor_context: ActorContext, *, candidate_permissions: int) -> None`
  - Гарантирует корректность состояния permissions subset перед выполнением операции. Args: actor_context: Контекст полномочий пользователя, выполняющего изменение. candidate_permissions: Данные candidate permissions, участвующие в обработке текущей операции.
- `_membership_top_position(membership: Membership | None) -> int`
  - Вспомогательная функция `_membership_top_position` реализует внутренний шаг бизнес-логики. Args: membership: Запись участия пользователя в комнате. Returns: Целочисленный результат вычисления.
- `_obj_pk(value: object, *, field_name: str='object') -> int`
  - Вспомогательная функция `_obj_pk` реализует внутренний шаг бизнес-логики. Args: value: Значение, которое нужно нормализовать или проверить. field_name: Параметр field name, используемый в логике функции. Returns: Целочисленный результат вычисления.
- `_membership_user_id(membership: Membership) -> int`
  - Вспомогательная функция `_membership_user_id` реализует внутренний шаг бизнес-логики. Args: membership: Запись участия пользователя в комнате. Returns: Целочисленный результат вычисления.
- `_override_target_role_id(override: PermissionOverride) -> int | None`
  - Вспомогательная функция `_override_target_role_id` реализует внутренний шаг бизнес-логики. Args: override: Параметр override, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_override_target_user_id(override: PermissionOverride) -> int | None`
  - Вспомогательная функция `_override_target_user_id` реализует внутренний шаг бизнес-логики. Args: override: Параметр override, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_ensure_manage_member(actor_context: ActorContext, membership: Membership) -> None`
  - Гарантирует корректность состояния manage member перед выполнением операции. Args: actor_context: Контекст полномочий пользователя, выполняющего изменение. membership: Данные membership, участвующие в обработке текущей операции.
- `actor_can_manage_roles(room_id: int, actor) -> bool`
  - Вспомогательная функция `actor_can_manage_roles` реализует внутренний шаг бизнес-логики. Args: room_id: Идентификатор комнаты. actor: Пользователь, инициирующий действие. Returns: Логическое значение результата проверки.
- `_room_actor_context_or_raise(room_id: int, actor) -> RoomActorContext`
  - Выполняет вспомогательную обработку для room actor context or raise. Args: room_id: Идентификатор room. actor: Пользователь, инициирующий действие. Returns: Объект типа RoomActorContext, полученный при выполнении операции.
- `list_room_roles(room_id: int, actor)`
  - Возвращает список room roles, доступных в текущем контексте. Args: room_id: Идентификатор room, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. Returns: Функция не возвращает значение.
- `create_room_role(room_id: int, actor, *, name: str, color: str, position: int, permissions: int) -> Role`
  - Создает room role и возвращает созданную сущность. Args: room_id: Идентификатор room, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. name: Человекочитаемое имя сущности или объекта. color: Цвет роли, отображаемый в интерфейсе клиента. position: Позиция роли в иерархии комнаты. permissions: Набор прав доступа, применяемых к роли или участнику. Returns: Объект типа Role, сформированный в рамках обработки.
- `update_room_role(room_id: int, role_id: int, actor, *, name: str | None=None, color: str | None=None, position: int | None=None, permissions: int | None=None) -> Role`
  - Обновляет room role и фиксирует изменения в хранилище. Args: room_id: Идентификатор room, используемый для выборки данных. role_id: Идентификатор role, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. name: Человекочитаемое имя сущности или объекта. color: Цвет роли, отображаемый в интерфейсе клиента. position: Позиция роли в иерархии комнаты. permissions: Набор прав доступа, применяемых к роли или участнику. Returns: Объект типа Role, сформированный в рамках обработки.
- `delete_room_role(room_id: int, role_id: int, actor) -> None`
  - Удаляет room role и выполняет сопутствующие действия. Args: room_id: Идентификатор room, используемый для выборки данных. role_id: Идентификатор role, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе.
- `get_member_roles(room_id: int, user_id: int, actor) -> Membership`
  - Возвращает member roles из текущего контекста или хранилища. Args: room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. Returns: Объект типа Membership, сформированный в рамках обработки.
- `set_member_roles(room_id: int, user_id: int, actor, role_ids: list[int]) -> Membership`
  - Устанавливает member roles с учетом текущих правил приложения. Args: room_id: Идентификатор room, используемый для выборки данных. user_id: Идентификатор user, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. role_ids: Список идентификаторов role для пакетной обработки. Returns: Объект типа Membership, сформированный в рамках обработки.
- `list_room_overrides(room_id: int, actor)`
  - Возвращает список room overrides, доступных в текущем контексте. Args: room_id: Идентификатор room, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. Returns: Функция не возвращает значение.
- `_resolve_override_target(*, room: Room, actor_context: ActorContext, target_role_id: int | None, target_user_id: int | None) -> tuple[Role | None, Membership | None]`
  - Определяет override target на основе доступного контекста. Args: room: Экземпляр комнаты, над которой выполняется действие. actor_context: Контекст полномочий пользователя, выполняющего изменение. target_role_id: Идентификатор target role, используемый для выборки данных. target_user_id: Идентификатор target user, используемый для выборки данных. Returns: Кортеж типа tuple[Role | None, Membership | None] с результатами операции.
- `create_room_override(room_id: int, actor, *, target_role_id: int | None, target_user_id: int | None, allow: int, deny: int) -> PermissionOverride`
  - Создает room override и возвращает созданную сущность. Args: room_id: Идентификатор room, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. target_role_id: Идентификатор target role, используемый для выборки данных. target_user_id: Идентификатор target user, используемый для выборки данных. allow: Битовая маска явно разрешенных действий. deny: Битовая маска явно запрещенных действий. Returns: Объект типа PermissionOverride, сформированный в рамках обработки.
- `update_room_override(room_id: int, override_id: int, actor, *, allow: int | None=None, deny: int | None=None) -> PermissionOverride`
  - Обновляет room override и фиксирует изменения в хранилище. Args: room_id: Идентификатор room, используемый для выборки данных. override_id: Идентификатор override, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе. allow: Битовая маска явно разрешенных действий. deny: Битовая маска явно запрещенных действий. Returns: Объект типа PermissionOverride, сформированный в рамках обработки.
- `delete_room_override(room_id: int, override_id: int, actor) -> None`
  - Удаляет room override и выполняет сопутствующие действия. Args: room_id: Идентификатор room, используемый для выборки данных. override_id: Идентификатор override, используемый для выборки данных. actor: Пользователь, инициирующий действие в системе.
- `permissions_for_me(room_id: int, actor) -> dict[str, object]`
  - Вспомогательная функция `permissions_for_me` реализует внутренний шаг бизнес-логики. Args: room_id: Идентификатор комнаты. actor: Пользователь, инициирующий действие. Returns: Словарь типа dict[str, object] с данными результата.

### Classes

- `RoomActorContext`
  - Класс RoomActorContext инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/roles/application/permission_service.py`

- Description: Permission computation and read-only role access checks.
- Functions: 17
- Classes: 1

### Functions

- `_is_superuser(user) -> bool`
  - Проверяет условие superuser и возвращает логический результат. Args: user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
- `_role_pk(role) -> int | None`
  - Вспомогательная функция `_role_pk` реализует внутренний шаг бизнес-логики. Args: role: Параметр role, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_membership_user_id(membership) -> int | None`
  - Вспомогательная функция `_membership_user_id` реализует внутренний шаг бизнес-логики. Args: membership: Запись участия пользователя в комнате. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_override_target_role_id(override) -> int | None`
  - Вспомогательная функция `_override_target_role_id` реализует внутренний шаг бизнес-логики. Args: override: Параметр override, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_override_target_user_id(override) -> int | None`
  - Вспомогательная функция `_override_target_user_id` реализует внутренний шаг бизнес-логики. Args: override: Параметр override, используемый в логике функции. Returns: Объект типа int | None, сформированный в ходе выполнения.
- `_top_role_position_for_membership(membership) -> int`
  - Вспомогательная функция `_top_role_position_for_membership` реализует внутренний шаг бизнес-логики. Args: membership: Запись участия пользователя в комнате. Returns: Целочисленный результат вычисления.
- `_compute_direct_permissions(room: Room, user) -> Perm`
  - Выполняет вспомогательную обработку для compute direct permissions. Args: room: Комната, в контексте которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Объект типа Perm, полученный при выполнении операции.
- `_get_default_everyone_permissions(room: Room) -> int`
  - Возвращает default everyone permissions из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Целочисленное значение результата вычисления.
- `compute_permissions(room: Room, user) -> Perm`
  - Вычисляет permissions на основе входных данных. Args: room: Комната, в контексте которой выполняется операция. user: Пользователь, для которого выполняется операция. Returns: Объект типа Perm, сформированный в ходе выполнения.
- `has_permission(room: Room, user, perm: Perm) -> bool`
  - Проверяет условие permission и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. perm: Имя отдельного разрешения, проверяемого в наборе прав. Returns: Логическое значение результата проверки.
- `can_read(room: Room, user) -> bool`
  - Проверяет условие read и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
- `can_write(room: Room, user) -> bool`
  - Проверяет условие write и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
- `ensure_can_read_or_404(room: Room, user) -> None`
  - Гарантирует корректность состояния can read or 404 перед выполнением операции. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция.
- `ensure_can_write(room: Room, user) -> bool`
  - Гарантирует корректность состояния can write перед выполнением операции. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
- `get_user_role(room: Room, user) -> str | None`
  - Возвращает user role из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Объект типа str | None, сформированный в рамках обработки.
- `get_actor_context(room: Room, actor) -> ActorContext`
  - Возвращает actor context из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. actor: Пользователь, инициирующий действие в системе. Returns: Объект типа ActorContext, сформированный в рамках обработки.
- `can_manage_roles(room: Room, actor) -> bool`
  - Проверяет условие manage roles и возвращает логический результат. Args: room: Экземпляр комнаты, над которой выполняется действие. actor: Пользователь, инициирующий действие в системе. Returns: Логическое значение результата проверки.

### Classes

- `ActorContext`
  - Класс ActorContext инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/roles/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `RolesConfig` : `AppConfig`
  - Класс RolesConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `ready(self)`
    - Инициализирует интеграции и сигналы при запуске приложения.

## `backend/roles/domain/__init__.py`

- Description: Domain layer for roles and permissions.
- Functions: 0
- Classes: 0

## `backend/roles/domain/rules.py`

- Description: Pure domain rules for role permissions and hierarchy checks.
- Functions: 9
- Classes: 0

### Functions

- `parse_direct_pair_key(pair_key: str | None) -> tuple[int, int] | None`
  - Разбирает direct pair key из входных данных с валидацией формата. Args: pair_key: Ключ пары разрешений allow/deny. Returns: Кортеж типа tuple[int, int] | None с результатами операции.
- `direct_access_allowed(*, user_id: int | None, pair: tuple[int, int] | None, membership_user_ids: set[int], banned_user_ids: set[int]) -> bool`
  - Вспомогательная функция `direct_access_allowed` реализует внутренний шаг бизнес-логики. Args: user_id: Идентификатор user. pair: Параметр pair, используемый в логике функции. membership_user_ids: Список идентификаторов membership user. banned_user_ids: Список идентификаторов banned user. Returns: Логическое значение результата проверки.
- `resolve_permissions(*, everyone_permissions: int, role_permissions: Iterable[int], role_overrides: Iterable[tuple[int, int]], user_overrides: Iterable[tuple[int, int]]) -> Perm`
  - Определяет permissions на основе доступного контекста. Args: everyone_permissions: Права роли everyone, действующие для всех участников. role_permissions: Права, назначенные ролями участника комнаты. role_overrides: Переопределения прав, примененные к ролям. user_overrides: Пользовательские переопределения прав на уровне участника. Returns: Объект типа Perm, сформированный в рамках обработки.
- `is_permission_subset(*, candidate: int, holder: int) -> bool`
  - Проверяет условие permission subset и возвращает логический результат. Args: candidate: Кандидатный объект для сравнения с текущим контекстом. holder: Сущность, в которой хранится сравниваемое значение. Returns: Логическое значение результата проверки.
- `can_manage_target(*, actor_top_position: int, target_position: int) -> bool`
  - Проверяет условие manage target и возвращает логический результат. Args: actor_top_position: Максимальная позиция роли текущего пользователя. target_position: Позиция роли целевого пользователя или объекта. Returns: Логическое значение результата проверки.
- `normalize_role_ids(raw_role_ids: Iterable[int | str]) -> list[int]`
  - Нормализует role ids к внутреннему формату приложения. Args: raw_role_ids: Список идентификаторов raw role для пакетной обработки. Returns: Список типа list[int] с результатами операции.
- `validate_override_target_ids(target_role_id: int | None, target_user_id: int | None) -> bool`
  - Проверяет значение поля override target ids и возвращает нормализованный результат. Args: target_role_id: Идентификатор target role, используемый для выборки данных. target_user_id: Идентификатор target user, используемый для выборки данных. Returns: Логическое значение результата проверки.
- `has_manage_roles(permissions: int) -> bool`
  - Проверяет условие manage roles и возвращает логический результат. Args: permissions: Набор прав доступа, применяемых к роли или участнику. Returns: Логическое значение результата проверки.
- `role_is_protected(*, is_default: bool, name: str) -> bool`
  - Проверяет роль с учетом защищенный ответ. Args: is_default: Булев флаг условия default. name: Имя сущности или параметра. Returns: Логическое значение результата проверки.

## `backend/roles/infrastructure/__init__.py`

- Description: Infrastructure layer for roles app.
- Functions: 0
- Classes: 0

## `backend/roles/infrastructure/repositories.py`

- Description: ORM repositories for role permissions and management.
- Functions: 10
- Classes: 0

### Functions

- `get_room_by_id(room_id: int) -> Room | None`
  - Возвращает room by id из текущего контекста или хранилища. Args: room_id: Идентификатор room, используемый для выборки данных. Returns: Объект типа Room | None, сформированный в рамках обработки.
- `get_default_role_permissions(room: Room) -> int | None`
  - Возвращает default role permissions из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа int | None, сформированный в рамках обработки.
- `get_membership(room: Room, user) -> Membership | None`
  - Возвращает membership из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. user: Пользователь, для которого выполняется операция. Returns: Объект типа Membership | None, сформированный в рамках обработки.
- `get_membership_by_user_id(room: Room, user_id: int) -> Membership | None`
  - Возвращает membership by user id из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. user_id: Идентификатор user, используемый для выборки данных. Returns: Объект типа Membership | None, сформированный в рамках обработки.
- `list_memberships(room: Room) -> QuerySet[Membership]`
  - Возвращает список memberships, доступных в текущем контексте. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа QuerySet[Membership], сформированный в рамках обработки.
- `list_roles(room: Room) -> QuerySet[Role]`
  - Возвращает список roles, доступных в текущем контексте. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа QuerySet[Role], сформированный в рамках обработки.
- `get_role(room: Room, role_id: int) -> Role | None`
  - Возвращает role из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. role_id: Идентификатор role, используемый для выборки данных. Returns: Объект типа Role | None, сформированный в рамках обработки.
- `list_overrides(room: Room) -> QuerySet[PermissionOverride]`
  - Возвращает список overrides, доступных в текущем контексте. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа QuerySet[PermissionOverride], сформированный в рамках обработки.
- `get_override(room: Room, override_id: int) -> PermissionOverride | None`
  - Возвращает override из текущего контекста или хранилища. Args: room: Экземпляр комнаты, над которой выполняется действие. override_id: Идентификатор override, используемый для выборки данных. Returns: Объект типа PermissionOverride | None, сформированный в рамках обработки.
- `get_user_by_id(user_id: int)`
  - Возвращает user by id из текущего контекста или хранилища. Args: user_id: Идентификатор user, используемый для выборки данных. Returns: Функция не возвращает значение.

## `backend/roles/interfaces/__init__.py`

- Description: HTTP interfaces for role management.
- Functions: 0
- Classes: 0

## `backend/roles/interfaces/permissions.py`

- Description: Permission classes for role management API.
- Functions: 0
- Classes: 1

### Classes

- `CanManageRoomRoles` : `BasePermission`
  - Класс CanManageRoomRoles инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `has_permission(self, request: Any, view: Any)`
    - Проверяет условие permission и возвращает логический результат. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. view: Экземпляр представления, для которого проверяется разрешение. Returns: Функция не возвращает значение.

## `backend/roles/interfaces/serializers.py`

- Description: Serializers for role-management HTTP API.
- Functions: 0
- Classes: 8

### Classes

- `RoleOutputSerializer` : `serializers.ModelSerializer`
  - Класс RoleOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `RoleCreateInputSerializer` : `serializers.Serializer`
  - Класс RoleCreateInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `RoleUpdateInputSerializer` : `serializers.Serializer`
  - Класс RoleUpdateInputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `validate(self, attrs)`
    - Проверяет входные данные и возвращает нормализованный результат. Args: attrs: Атрибуты после первичной валидации. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `MemberRolesOutputSerializer` : `serializers.ModelSerializer`
  - Класс MemberRolesOutputSerializer сериализует и валидирует данные API.
  - Methods: 2
  - `get_roleIds(self, obj: Membership) -> list[int]`
    - Возвращает role ids из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Список типа list[int] с результатами операции.
  - `get_username(self, obj: Membership) -> str`
    - Возвращает username из текущего контекста или хранилища. Args: obj: Объект доменной модели или ORM-сущность. Returns: Строковое значение, сформированное функцией.
- `MemberRolesUpdateInputSerializer` : `serializers.Serializer`
  - Класс MemberRolesUpdateInputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `OverrideOutputSerializer` : `serializers.ModelSerializer`
  - Класс OverrideOutputSerializer сериализует и валидирует данные API.
  - Methods: 0
- `OverrideCreateInputSerializer` : `serializers.Serializer`
  - Класс OverrideCreateInputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `validate(self, attrs)`
    - Проверяет входные данные и возвращает нормализованный результат. Args: attrs: Атрибуты после первичной валидации. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `OverrideUpdateInputSerializer` : `serializers.Serializer`
  - Класс OverrideUpdateInputSerializer сериализует и валидирует данные API.
  - Methods: 1
  - `validate(self, attrs)`
    - Проверяет входные данные и возвращает нормализованный результат. Args: attrs: Атрибуты после первичной валидации. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/roles/interfaces/urls.py`

- Description: URL routes for room-scoped role management API.
- Functions: 0
- Classes: 0

## `backend/roles/models.py`

- Description: Discord-style role and membership models. Role      — per-room role definition with permissions bitmask and hierarchy. Membership — links a user to a room; carries M2M roles and ban state. Direct chats have no roles — access is based on Room.direct_pair_key.
- Functions: 0
- Classes: 3

### Classes

- `Role` : `models.Model`
  - Модель Role описывает структуру и поведение данных в приложении.
  - Methods: 2
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
  - `create_defaults_for_room(cls, room: Room) -> dict[str, 'Role']`
    - Создает defaults for room и возвращает созданную сущность. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Словарь типа dict[str, 'Role'] с результатами операции.
- `Membership` : `models.Model`
  - Модель Membership описывает структуру и поведение данных в приложении.
  - Methods: 3
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
  - `display_name(self) -> str`
    - Вспомогательная функция `display_name` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
  - `is_muted(self) -> bool`
    - Проверяет условие muted и возвращает логический результат. Returns: Логическое значение результата проверки.
- `PermissionOverride` : `models.Model`
  - Модель PermissionOverride описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/roles/permissions.py`

- Description: Discord-style bitwise permission system. Each permission is a single bit in a 64-bit integer. Roles store a bitmask of granted permissions. Resolution: base(@everyone) | role1 | role2 | ... → effective permissions. ADMINISTRATOR bypasses all checks.
- Functions: 1
- Classes: 1

### Functions

- `has_perm(permissions: int, perm: Perm) -> bool`
  - Проверяет условие perm и возвращает логический результат. Args: permissions: Набор прав доступа, применяемых к роли или участнику. perm: Имя отдельного разрешения, проверяемого в наборе прав. Returns: Логическое значение результата проверки.

### Classes

- `Perm` : `IntFlag`
  - Класс Perm инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/roles/signals.py`

- Functions: 4
- Classes: 0

### Functions

- `audit_membership_save(sender, instance: Membership, created: bool, **kwargs)`
  - Фиксирует membership save в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. created: Флаг создания новой записи. **kwargs: Дополнительные именованные аргументы вызова.
- `audit_membership_delete(sender, instance: Membership, **kwargs)`
  - Фиксирует membership delete в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. **kwargs: Дополнительные именованные аргументы вызова.
- `audit_role_save(sender, instance: Role, created: bool, **kwargs)`
  - Фиксирует role save в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. created: Флаг создания новой записи. **kwargs: Дополнительные именованные аргументы вызова.
- `audit_role_delete(sender, instance: Role, **kwargs)`
  - Фиксирует role delete в системе аудита. Args: sender: Параметр sender, используемый в логике функции. instance: Экземпляр модели или доменного объекта. **kwargs: Дополнительные именованные аргументы вызова.

## `backend/roles/tests/__init__.py`

- Functions: 0
- Classes: 0

## `backend/roles/tests/test_domain_rules.py`

- Functions: 0
- Classes: 1

### Classes

- `RoleDomainRulesTests` : `SimpleTestCase`
  - Methods: 6
  - `test_parse_direct_pair_key_valid_and_invalid(self)`
  - `test_direct_access_allowed_invariant(self)`
  - `test_resolve_permissions_applies_overrides(self)`
  - `test_resolve_permissions_returns_all_for_admin(self)`
  - `test_permission_and_hierarchy_helpers(self)`
  - `test_normalize_role_ids_target_validation_and_protected_checks(self)`

## `backend/roles/tests/test_interface_permissions.py`

- Description: Tests for DRF permission wrappers in roles interfaces.
- Functions: 0
- Classes: 1

### Classes

- `CanManageRoomRolesTests` : `SimpleTestCase`
  - Methods: 5
  - `setUp(self)`
  - `test_denies_when_room_id_missing_or_invalid(self)`
  - `test_denies_when_user_not_authenticated(self)`
  - `test_allows_when_service_grants_access(self, actor_can_manage_roles_mock)`
  - `test_denies_when_service_denies_access(self, actor_can_manage_roles_mock)`

## `backend/roles/tests/test_management_service_helpers.py`

- Functions: 3
- Classes: 2

### Functions

- `_room_stub(**kwargs) -> Room`
- `_membership_stub(**kwargs) -> Membership`
- `_override_stub(**kwargs) -> PermissionOverride`

### Classes

- `_RolesManager`
  - Methods: 3
  - `__init__(self, roles)`
  - `order_by(self, *_args, **_kwargs)`
  - `first(self)`
- `ManagementServiceHelperTests` : `SimpleTestCase`
  - Methods: 12
  - `test_load_room_and_authentication_guards(self)`
  - `test_permissions_subset_and_membership_position_helpers(self)`
  - `test_object_and_membership_identity_helpers(self)`
  - `test_override_target_helpers_and_manage_roles_predicate(self)`
  - `test_list_room_roles_and_member_not_found_paths(self)`
  - `test_update_room_role_error_and_change_paths(self)`
  - `test_resolve_override_target_validation_and_lookup_errors(self)`
  - `test_create_room_role_conflict_when_name_exists(self)`
  - `test_update_room_role_conflict_when_save_raises_integrity(self)`
  - `test_delete_room_role_not_found_and_protected(self)`
  - `test_update_room_override_error_paths_and_change_save(self)`
  - `test_delete_room_override_error_and_target_branches(self)`

## `backend/roles/tests/test_permission_service.py`

- Functions: 1
- Classes: 3

### Functions

- `_room_stub(**kwargs) -> Room`

### Classes

- `_RolesManager`
  - Methods: 4
  - `__init__(self, roles)`
  - `all(self)`
  - `order_by(self, *_args, **_kwargs)`
  - `first(self)`
- `PermissionServiceHelpersTests` : `SimpleTestCase`
  - Methods: 4
  - `test_role_and_membership_id_helpers(self)`
  - `test_override_target_helpers(self)`
  - `test_top_role_position_helper(self)`
  - `test_default_everyone_permissions_fallbacks(self)`
- `PermissionServiceBehaviorTests` : `SimpleTestCase`
  - Methods: 6
  - `test_compute_permissions_returns_all_for_superuser(self)`
  - `test_get_actor_context_returns_superuser_top_position(self)`
  - `test_compute_permissions_returns_zero_for_membership_when_user_pk_missing(self)`
  - `test_compute_permissions_applies_matching_role_and_user_overrides(self)`
  - `test_get_user_role_variants_and_actor_context(self)`
  - `test_read_write_helpers(self)`

## `backend/roles/tests/test_permissions_bits.py`

- Functions: 0
- Classes: 1

### Classes

- `PermissionBitsTests` : `SimpleTestCase`
  - Methods: 1
  - `test_has_perm_checks_admin_override_and_direct_bit(self)`

## `backend/rooms/__init__.py`

- Functions: 0
- Classes: 0

## `backend/rooms/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `RoomsConfig` : `AppConfig`
  - Класс RoomsConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `ready(self)`
    - Инициализирует интеграции и сигналы при запуске приложения.

## `backend/rooms/signals.py`

- Description: Signals for room identity invariants.
- Functions: 1
- Classes: 0

### Functions

- `ensure_group_public_id_on_create(sender, instance: Room, **kwargs)`
  - Гарантирует корректность состояния group public id on create перед выполнением операции. Args: sender: Модель-источник сигнала Django. instance: Экземпляр модели или объекта домена. **kwargs: Дополнительные именованные аргументы вызова.

## `backend/users/__init__.py`

- Description: Инициализирует пакет `users`.
- Functions: 0
- Classes: 0

## `backend/users/admin.py`

- Description: Модуль admin реализует прикладную логику подсистемы users.
- Functions: 0
- Classes: 5

### Classes

- `ProfileInlineForm` : `forms.ModelForm`
  - Форма ProfileInlineForm валидирует и подготавливает входные данные.
  - Methods: 2
  - `__init__(self, *args, **kwargs)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: *args: Дополнительные позиционные аргументы вызова. **kwargs: Дополнительные именованные аргументы вызова.
  - `save(self, commit=True)`
    - Сохраняет изменения объекта в хранилище. Args: commit: Параметр commit, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `ProfileInline` : `admin.StackedInline`
  - Класс ProfileInline настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `username_display(self, obj)`
    - Вспомогательная функция `username_display` реализует внутренний шаг бизнес-логики. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
  - `avatar_preview(self, obj)`
    - Вспомогательная функция `avatar_preview` реализует внутренний шаг бизнес-логики. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `UserAdmin` : `BaseUserAdmin`
  - Класс UserAdmin настраивает поведение сущности в Django Admin.
  - Methods: 1
  - `profile_last_seen(self, obj)`
    - Формирует значение profile last seen для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `ProfileAdminForm` : `ProfileInlineForm`
  - Класс ProfileAdminForm инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `ProfileAdmin` : `admin.ModelAdmin`
  - Класс ProfileAdmin настраивает поведение сущности в Django Admin.
  - Methods: 2
  - `is_staff(self, obj)`
    - Проверяет условие staff и возвращает логический результат. Args: obj: Объект доменной модели или ORM-сущность. Returns: Функция не возвращает значение.
  - `avatar_preview(self, obj)`
    - Формирует значение avatar preview для отображения в админ-панели. Args: obj: Параметр obj, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/users/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/users/application/media_access_service.py`

- Description: Сервис проверок доступа к защищенным media-файлам.
- Functions: 3
- Classes: 2

### Functions

- `_parse_positive_room_id(value: int | str | None) -> int | None`
  - Разбирает positive room id из входных данных с валидацией формата. Args: value: Входное значение для проверки или преобразования. Returns: Объект типа int | None, сформированный в рамках обработки.
- `resolve_media_content_type(normalized_path: str, *, preferred_content_type: str | None=None) -> str`
  - Определяет media content type на основе доступного контекста. Args: normalized_path: Нормализованный путь к файлу или media-объекту. preferred_content_type: Предпочтительный MIME-тип ответа. Returns: Строковое значение, сформированное функцией.
- `resolve_attachment_media_access(*, normalized_path: str, room_id_raw: int | str | None, user: Any) -> AttachmentMediaAccessResult`
  - Определяет attachment media access на основе доступного контекста. Args: normalized_path: Нормализованный путь к файлу или media-объекту. room_id_raw: Сырой идентификатор комнаты из query-параметров. user: Пользователь, для которого выполняется операция. Returns: Объект типа AttachmentMediaAccessResult, сформированный в рамках обработки.

### Classes

- `MediaAccessNotFoundError` : `Exception`
  - Класс MediaAccessNotFoundError инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0
- `AttachmentMediaAccessResult`
  - Класс AttachmentMediaAccessResult инкапсулирует связанную бизнес-логику модуля.
  - Methods: 0

## `backend/users/apps.py`

- Description: Модуль apps реализует прикладную логику подсистемы users.
- Functions: 0
- Classes: 1

### Classes

- `UsersConfig` : `AppConfig`
  - Класс UsersConfig инкапсулирует связанную бизнес-логику модуля.
  - Methods: 1
  - `ready(self)`
    - Инициализирует интеграции и сигналы при запуске приложения.

## `backend/users/avatar_service.py`

- Description: Единый сервис выбора источника аватара и сборки URL.
- Functions: 25
- Classes: 0

### Functions

- `_trimmed(value: Any) -> str`
  - Выполняет вспомогательную обработку для trimmed. Args: value: Входное значение для проверки или преобразования. Returns: Строковое значение, сформированное функцией.
- `_normalized_media_path(value: str | None) -> str`
  - Выполняет вспомогательную обработку для normalized media path. Args: value: Входное значение для проверки или преобразования. Returns: Строковое значение, сформированное функцией.
- `_setting_media_path(name: str, default: str) -> str`
  - Выполняет вспомогательную обработку для setting media path. Args: name: Человекочитаемое имя объекта или параметра. default: Значение по умолчанию при отсутствии входных данных. Returns: Строковое значение, сформированное функцией.
- `_setting_media_dir(name: str, default: str) -> str`
  - Выполняет вспомогательную обработку для setting media dir. Args: name: Человекочитаемое имя объекта или параметра. default: Значение по умолчанию при отсутствии входных данных. Returns: Строковое значение, сформированное функцией.
- `user_password_default_avatar_path() -> str`
  - Вспомогательная функция `user_password_default_avatar_path` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
- `user_oauth_default_avatar_path() -> str`
  - Вспомогательная функция `user_oauth_default_avatar_path` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
- `group_default_avatar_path() -> str`
  - Вспомогательная функция `group_default_avatar_path` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
- `user_avatar_upload_dir() -> str`
  - Вспомогательная функция `user_avatar_upload_dir` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
- `group_avatar_upload_dir() -> str`
  - Вспомогательная функция `group_avatar_upload_dir` реализует внутренний шаг бизнес-логики. Returns: Строковое значение, сформированное функцией.
- `_safe_upload_filename(filename: str | None) -> str`
  - Выполняет вспомогательную обработку для safe upload filename. Args: filename: Имя файла, переданного в обработку. Returns: Строковое значение, сформированное функцией.
- `user_has_oauth_identity(user: Any) -> bool`
  - Проверяет наличие пользователь с учетом OAuth identity-данные. Args: user: Пользователь, для которого выполняется операция. Returns: Логическое значение результата проверки.
- `profile_avatar_upload_to(profile, filename: str) -> str`
  - Вспомогательная функция `profile_avatar_upload_to` реализует внутренний шаг бизнес-логики. Args: profile: Параметр profile, используемый в логике функции. filename: Параметр filename, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `group_avatar_upload_to(_room, filename: str) -> str`
  - Вспомогательная функция `group_avatar_upload_to` реализует внутренний шаг бизнес-логики. Args: _room: Комната, переданная в upload_to-хук. filename: Параметр filename, используемый в логике функции. Returns: Строковое значение, сформированное функцией.
- `_safe_profile(user: Any)`
  - Выполняет вспомогательную обработку для safe profile. Args: user: Пользователь, для которого выполняется операция. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `_is_http_url(value: str) -> bool`
  - Проверяет условие http url и возвращает логический результат. Args: value: Входное значение для проверки или преобразования. Returns: Логическое значение результата проверки.
- `_is_same_media_file(path: str, candidate: str) -> bool`
  - Проверяет условие same media file и возвращает логический результат. Args: path: Путь к ресурсу в storage или media-каталоге. candidate: Кандидатный объект для сравнения с текущим контекстом. Returns: Логическое значение результата проверки.
- `_is_default_user_image(path: str) -> bool`
  - Проверяет условие default user image и возвращает логический результат. Args: path: Путь к ресурсу в storage или media-каталоге. Returns: Логическое значение результата проверки.
- `resolve_user_avatar_source(user: Any) -> str | None`
  - Определяет user avatar source на основе доступного контекста. Args: user: Пользователь, для которого выполняется операция. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_group_avatar_source(room: Any) -> str | None`
  - Определяет group avatar source на основе доступного контекста. Args: room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_avatar_url_from_request(request, source: str | None) -> str | None`
  - Определяет avatar url from request на основе доступного контекста. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. source: Источник данных или медиа-путь, который нужно обработать. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_avatar_url_from_scope(scope, source: str | None) -> str | None`
  - Определяет avatar url from scope на основе доступного контекста. Args: scope: ASGI-scope с метаданными соединения. source: Источник данных или медиа-путь, который нужно обработать. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_user_avatar_url_from_request(request, user: Any) -> str | None`
  - Определяет user avatar url from request на основе доступного контекста. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. user: Пользователь, для которого выполняется операция. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_user_avatar_url_from_scope(scope, user: Any) -> str | None`
  - Определяет user avatar url from scope на основе доступного контекста. Args: scope: ASGI-scope с метаданными соединения. user: Пользователь, для которого выполняется операция. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_group_avatar_url_from_request(request, room: Any) -> str | None`
  - Определяет group avatar url from request на основе доступного контекста. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа str | None, сформированный в рамках обработки.
- `resolve_group_avatar_url_from_scope(scope, room: Any) -> str | None`
  - Определяет group avatar url from scope на основе доступного контекста. Args: scope: ASGI-scope с метаданными соединения. room: Экземпляр комнаты, над которой выполняется действие. Returns: Объект типа str | None, сформированный в рамках обработки.

## `backend/users/forms.py`

- Description: Формы для регистрации, профиля и публичного имени пользователя.
- Functions: 4
- Classes: 4

### Functions

- `_validate_username_symbols(username: str) -> None`
  - Проверяет значение поля username symbols и возвращает нормализованный результат. Args: username: Публичное имя пользователя, используемое в событиях и ответах.
- `_is_svg_upload(uploaded_file) -> bool`
  - Проверяет условие svg upload и возвращает логический результат. Args: uploaded_file: Файл, загруженный пользователем через форму или API. Returns: Логическое значение результата проверки.
- `_read_uploaded_bytes(uploaded_file) -> bytes`
  - Читает uploaded байты. Args: uploaded_file: Файл, полученный из multipart-запроса. Returns: Объект типа bytes, сформированный в ходе выполнения.
- `_validate_svg_avatar(uploaded_file) -> None`
  - Проверяет значение поля svg avatar и возвращает нормализованный результат. Args: uploaded_file: Файл, загруженный пользователем через форму или API.

### Classes

- `EmailRegisterForm` : `forms.Form`
  - Форма EmailRegisterForm валидирует и подготавливает входные данные.
  - Methods: 2
  - `clean_email(self)`
    - Проверяет и нормализует значение поля email. Returns: Функция не возвращает значение.
  - `clean(self)`
    - Проверяет согласованность и валидность данных формы. Returns: Функция не возвращает значение.
- `UserUpdateForm` : `forms.ModelForm`
  - Форма UserUpdateForm валидирует и подготавливает входные данные.
  - Methods: 2
  - `clean_username(self)`
    - Проверяет и нормализует значение поля username. Returns: Функция не возвращает значение.
  - `clean_email(self)`
    - Проверяет и нормализует значение поля email. Returns: Функция не возвращает значение.
- `ProfileIdentityUpdateForm` : `forms.Form`
  - Форма ProfileIdentityUpdateForm валидирует и подготавливает входные данные.
  - Methods: 4
  - `__init__(self, *args, user=None, **kwargs)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: *args: Дополнительные позиционные аргументы вызова. user: Пользователь, для которого выполняется операция. **kwargs: Дополнительные именованные аргументы вызова.
  - `clean_name(self)`
    - Проверяет и нормализует значение поля name. Returns: Функция не возвращает значение.
  - `clean_username(self)`
    - Проверяет и нормализует значение поля username. Returns: Функция не возвращает значение.
  - `save(self, profile: Profile) -> Profile`
    - Сохраняет изменения объекта в хранилище. Args: profile: Параметр profile, используемый в логике функции. Returns: Объект типа Profile, сформированный в ходе выполнения.
- `ProfileUpdateForm` : `forms.ModelForm`
  - Форма ProfileUpdateForm валидирует и подготавливает входные данные.
  - Methods: 4
  - `clean_bio(self)`
    - Проверяет и нормализует значение поля bio. Returns: Функция не возвращает значение.
  - `clean(self)`
    - Проверяет согласованность и валидность данных формы. Returns: Функция не возвращает значение.
  - `clean_image(self)`
    - Проверяет и нормализует значение поля image. Returns: Функция не возвращает значение.
  - `save(self, commit=True)`
    - Сохраняет изменения объекта в хранилище. Args: commit: Параметр commit, используемый в логике функции. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/users/middleware.py`

- Description: Модуль middleware реализует прикладную логику подсистемы users.
- Functions: 0
- Classes: 1

### Classes

- `UpdateLastSeenMiddleware`
  - Класс UpdateLastSeenMiddleware инкапсулирует связанную бизнес-логику модуля.
  - Methods: 2
  - `__init__(self, get_response)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: get_response: Следующий middleware-обработчик в цепочке Django.
  - `__call__(self, request)`
    - Выполняет объект как вызываемый обработчик. Args: request: HTTP-запрос с контекстом пользователя и параметрами вызова. Returns: Результат вычислений, сформированный в ходе выполнения функции.

## `backend/users/models.py`

- Description: Модели пользователей, идентичностей и профиля.
- Functions: 0
- Classes: 7

### Classes

- `Profile` : `models.Model`
  - Модель Profile описывает структуру и поведение данных в приложении.
  - Methods: 3
  - `__init__(self, *args, **kwargs)`
    - Инициализирует экземпляр класса и подготавливает внутреннее состояние. Args: *args: Дополнительные позиционные аргументы вызова. **kwargs: Дополнительные именованные аргументы вызова.
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
  - `save(self, *args, **kwargs)`
    - Сохраняет изменения объекта в хранилище. Args: *args: Дополнительные позиционные аргументы вызова. **kwargs: Дополнительные именованные аргументы вызова.
- `UserIdentityCore` : `models.Model`
  - Модель UserIdentityCore описывает структуру и поведение данных в приложении.
  - Methods: 2
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
  - `save(self, *args, **kwargs)`
    - Сохраняет изменения объекта в хранилище. Args: *args: Дополнительные позиционные аргументы вызова. **kwargs: Дополнительные именованные аргументы вызова.
- `LoginIdentity` : `models.Model`
  - Модель LoginIdentity описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `EmailIdentity` : `models.Model`
  - Модель EmailIdentity описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `OAuthIdentity` : `models.Model`
  - Модель OAuthIdentity описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `PublicHandle` : `models.Model`
  - Модель PublicHandle описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.
- `SecurityRateLimitBucket` : `models.Model`
  - Модель SecurityRateLimitBucket описывает структуру и поведение данных в приложении.
  - Methods: 1
  - `__str__(self)`
    - Возвращает человекочитаемое строковое представление объекта. Returns: Функция не возвращает значение.

## `backend/users/tests/__init__.py`

- Description: Инициализирует пакет `tests`.
- Functions: 0
- Classes: 0

## `backend/users/tests/test_api_profile.py`

- Description: Tests for profile and public resolve endpoints in identity vNext.
- Functions: 0
- Classes: 2

### Classes

- `ProfileApiTests` : `TestCase`
  - Methods: 17
  - `setUp(self)`
  - `_csrf(self) -> str`
  - `_image_upload(filename: str='avatar.png', size=(20, 20)) -> SimpleUploadedFile`
  - `_svg_upload(filename: str='avatar.svg') -> SimpleUploadedFile`
  - `_assert_signed_profile_image(self, url: str)`
  - `test_profile_requires_auth(self)`
  - `test_get_profile_authenticated(self)`
  - `test_get_profile_authenticated_superuser_includes_flag(self)`
  - `test_profile_update_name_and_bio(self)`
  - `test_profile_handle_update_accepts_and_rejects_duplicate(self)`
  - `test_profile_handle_update_rejects_invalid_format(self)`
  - `test_public_resolve_user_hides_email(self)`
  - `test_signed_media_endpoint_allows_valid_and_rejects_invalid_requests(self)`
  - `test_signed_media_endpoint_accepts_double_encoded_path(self)`
  - `test_profile_update_rejects_oversized_image(self)`
  - `test_profile_update_accepts_custom_avatar_upload(self)`
  - `test_profile_update_accepts_svg_avatar_and_serves_svg_content_type(self)`
- `AttachmentMediaAccessTests` : `TestCase`
  - Methods: 15
  - `setUp(self)`
  - `_attachment_for_room(self, room: Room, *, author) -> MessageAttachment`
  - `_attachment_with_custom_file(self, room: Room, *, author, file_name: str, file_content_type: str, file_payload: bytes, thumbnail_name: str | None=None, thumbnail_content_type: str='application/octet-stream', thumbnail_payload: bytes=b'thumb') -> MessageAttachment`
  - `_svg_attachment_for_room(self, room: Room, *, author) -> MessageAttachment`
  - `_png_payload() -> bytes`
  - `_attachment_with_png_thumbnail_for_room(self, room: Room, *, author) -> MessageAttachment`
  - `test_attachment_media_view_returns_200_for_room_participant(self)`
  - `test_attachment_media_view_returns_200_for_non_owner_direct_participant(self)`
  - `test_attachment_media_view_returns_404_for_invalid_access_context(self)`
  - `test_attachment_media_view_returns_404_when_path_or_message_context_is_invalid(self)`
  - `test_public_room_attachment_access_allows_authenticated_reader_without_membership(self)`
  - `test_attachment_media_view_serves_svg_with_image_content_type(self)`
  - `test_attachment_media_view_serves_png_thumbnail_with_image_content_type(self)`
  - `test_attachment_media_view_serves_common_thumbnail_image_content_types(self)`
  - `test_attachment_media_view_denies_unauthorized_for_any_attachment_type(self)`

## `backend/users/tests/test_avatar_service.py`

- Description: Tests for unified avatar service.
- Functions: 0
- Classes: 1

### Classes

- `AvatarServiceTests` : `TestCase`
  - Methods: 13
  - `setUp(self)`
  - `test_password_user_uses_password_default_avatar_source(self)`
  - `test_oauth_user_uses_oauth_default_avatar_source_when_provider_avatar_missing(self)`
  - `test_oauth_user_prefers_provider_avatar_url(self)`
  - `test_custom_user_image_has_priority(self)`
  - `test_group_uses_group_default_avatar_when_custom_missing(self)`
  - `test_group_custom_avatar_has_priority(self)`
  - `test_request_avatar_url_for_default_password_avatar_is_signed(self)`
  - `test_scope_avatar_url_for_default_password_avatar_is_signed(self)`
  - `test_group_default_avatar_url_is_signed(self)`
  - `test_profile_avatar_upload_path_uses_users_folder_by_default(self)`
  - `test_profile_avatar_upload_path_uses_same_users_folder_for_oauth_users(self)`
  - `test_group_avatar_upload_path_uses_group_folder(self)`

## `backend/users/tests/test_forms.py`

- Description: Содержит тесты модуля `test_forms` подсистемы `users`.
- Functions: 0
- Classes: 2

### Classes

- `UserUpdateFormTests` : `TestCase`
  - Группирует тестовые сценарии класса `UserUpdateFormTests`.
  - Methods: 4
  - `test_allows_same_username_for_current_user(self)`
    - Проверяет сценарий `test_allows_same_username_for_current_user`.
  - `test_rejects_duplicate_username(self)`
    - Проверяет сценарий `test_rejects_duplicate_username`.
  - `test_username_length_boundary(self)`
    - Проверяет граничные значения длины username в форме профиля.
  - `test_rejects_duplicate_email_case_insensitive(self)`
    - Проверяет сценарий `test_rejects_duplicate_email_case_insensitive`.
- `ProfileUpdateFormTests` : `TestCase`
  - Группирует тестовые сценарии класса `ProfileUpdateFormTests`.
  - Methods: 10
  - `_image_upload(size=(20, 20)) -> SimpleUploadedFile`
    - Создает тестовую PNG-картинку заданного размера.
  - `_svg_upload(*, with_script: bool=False) -> SimpleUploadedFile`
  - `test_clean_bio_strips_html_tags(self)`
    - Проверяет сценарий `test_clean_bio_strips_html_tags`.
  - `test_clean_image_rejects_too_large_dimensions(self)`
    - Отклоняет изображение, если хотя бы одна сторона превышает лимит.
  - `test_clean_image_rejects_decompression_bomb(self)`
    - Отклоняет изображение при срабатывании защиты PIL от bomb-архивов.
  - `test_clean_image_accepts_safe_svg(self)`
  - `test_clean_image_rejects_svg_with_script(self)`
  - `test_accepts_complete_avatar_crop_payload(self)`
    - Сохраняет валидный набор crop-метаданных аватарки.
  - `test_rejects_partial_avatar_crop_payload(self)`
    - Отклоняет неполный набор crop-метаданных.
  - `test_rejects_out_of_bounds_avatar_crop_payload(self)`
    - Отклоняет crop-метаданные, выходящие за границы изображения.

## `backend/users/tests/test_media_access_service.py`

- Description: Unit tests for users.application.media_access_service.
- Functions: 0
- Classes: 1

### Classes

- `MediaAccessServiceTests` : `TestCase`
  - Methods: 9
  - `setUp(self)`
  - `_attachment_for_room(self, room: Room, *, author) -> MessageAttachment`
  - `test_resolve_media_content_type_uses_specific_preferred_type(self)`
  - `test_resolve_media_content_type_falls_back_to_extension_when_preferred_generic(self)`
  - `test_resolve_attachment_media_access_returns_preferred_type_for_original_file(self)`
  - `test_resolve_attachment_media_access_allows_non_owner_direct_participant(self)`
  - `test_resolve_attachment_media_access_returns_guess_for_thumbnail(self)`
  - `test_resolve_attachment_media_access_denies_unauthenticated_or_outsider(self)`
  - `test_resolve_attachment_media_access_allows_authenticated_reader_in_public_room(self)`

## `backend/users/tests/test_models.py`

- Description: Tests for users.models.
- Functions: 0
- Classes: 2

### Classes

- `ProfileModelTests` : `TestCase`
  - Methods: 2
  - `test_str_representation_contains_username(self)`
  - `test_save_strips_html_from_bio(self)`
- `ProfileImageProcessingTests` : `TestCase`
  - Methods: 10
  - `setUp(self)`
  - `tearDown(self)`
  - `_make_rgba_upload_with_jpg_name() -> SimpleUploadedFile`
  - `_png_bytes(color) -> bytes`
  - `_png_upload(size) -> SimpleUploadedFile`
  - `_svg_upload() -> SimpleUploadedFile`
  - `test_profile_save_handles_rgba_source_without_crash(self)`
  - `test_replacing_avatar_deletes_previous_file(self)`
  - `test_large_avatar_is_resized_to_safe_limit(self)`
  - `test_svg_avatar_is_saved_without_raster_processing(self)`

## `backend/users/tests/test_signals.py`

- Description: Содержит тесты модуля `test_signals` подсистемы `users`.
- Functions: 0
- Classes: 1

### Classes

- `UserSignalsTests` : `TestCase`
  - Группирует тестовые сценарии класса `UserSignalsTests`.
  - Methods: 6
  - `test_profile_created_for_new_user(self)`
    - Проверяет сценарий `test_profile_created_for_new_user`.
  - `test_profile_not_duplicated_on_user_update(self)`
    - Проверяет сценарий `test_profile_not_duplicated_on_user_update`.
  - `test_profile_recreated_if_removed_then_user_saved(self)`
    - Проверяет сценарий `test_profile_recreated_if_removed_then_user_saved`.
  - `test_signal_skips_raw_fixture_saves(self)`
    - Проверяет сценарий `test_signal_skips_raw_fixture_saves`.
  - `test_signal_handles_integrity_error_race(self)`
    - Проверяет сценарий `test_signal_handles_integrity_error_race`.
  - `test_username_rename_updates_messages_and_writes_audit_event(self)`
    - Проверяет сценарий `test_username_rename_updates_messages_and_writes_audit_event`.

## `backend/users/views.py`

- Description: Template-based views for users pages.
- Functions: 2
- Classes: 0

### Functions

- `register(request)`
  - Регистрирует данные. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
- `profile(request)`
  - Вспомогательная функция `profile` реализует внутренний шаг бизнес-логики. Args: request: HTTP-запрос с контекстом пользователя и входными данными. Returns: Результат вычислений, сформированный в ходе выполнения функции.
