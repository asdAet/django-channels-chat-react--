# Backend Reference

Generated: 2026-03-19T00:46:47Z

Total modules: 185

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
- `_parse_bool(raw_value, *, field_name: str) -> bool | None`
- `_parse_datetime(raw_value, *, field_name: str) -> datetime | None`
- `parse_filters(params) -> AuditQueryFilters`
- `list_events(filters: AuditQueryFilters)`
- `get_event(event_id: int)`
- `list_action_counts(filters: AuditQueryFilters)`

## `backend/auditlog/application/username_history_service.py`

- Functions: 1
- Classes: 0

### Functions

- `get_username_history(user_id: int, *, limit: int=200)`

## `backend/auditlog/application/write_service.py`

- Functions: 14
- Classes: 0

### Functions

- `_normalize_int(value)`
- `_scope_header(scope, name: bytes) -> str | None`
- `_get_or_create_request_id_for_request(request) -> str`
- `_get_or_create_request_id_for_scope(scope) -> str`
- `_extract_actor(actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None)`
- `_safe_metadata(metadata) -> dict`
- `_default_success(event: str, status_code: int | None) -> bool`
- `_persist_event_row(payload: dict) -> None`
- `_persist_event(payload: dict) -> None`
- `write_event(action: str, *, protocol=None, method=None, path=None, status_code=None, success=None, ip=None, request_id=None, actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None, metadata=None, **fields)`
- `audit_security_event(event: str, **fields) -> None`
- `audit_http_event(event: str, request, **fields) -> None`
- `audit_ws_event(event: str, scope, **fields) -> None`
- `audit_http_request(request, response=None, exception: Exception | None=None) -> None`

## `backend/auditlog/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditlogConfig` : `AppConfig`
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
  - Methods: 0

## `backend/auditlog/domain/context.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditQueryFilters`
  - Methods: 0

## `backend/auditlog/domain/sanitize.py`

- Functions: 1
- Classes: 0

### Functions

- `sanitize_value(value)`

## `backend/auditlog/infrastructure/__init__.py`

- Description: Infrastructure layer for audit logging.
- Functions: 0
- Classes: 0

## `backend/auditlog/infrastructure/cursor.py`

- Functions: 2
- Classes: 0

### Functions

- `encode_cursor(created_at: datetime, event_id: int) -> str`
- `decode_cursor(value: str | None) -> tuple[datetime, int] | None`

## `backend/auditlog/infrastructure/models.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditEvent` : `models.Model`
  - Methods: 1
  - `__str__(self)`

## `backend/auditlog/infrastructure/query_builder.py`

- Functions: 1
- Classes: 0

### Functions

- `apply_filters(queryset: QuerySet[AuditEvent], filters: AuditQueryFilters, *, include_action_filters: bool=True) -> QuerySet[AuditEvent]`

## `backend/auditlog/infrastructure/repository.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditEventRepository`
  - Methods: 2
  - `create(**kwargs) -> AuditEvent`
  - `all() -> QuerySet[AuditEvent]`

## `backend/auditlog/interfaces/__init__.py`

- Description: Interfaces for auditlog app.
- Functions: 0
- Classes: 0

## `backend/auditlog/interfaces/admin.py`

- Functions: 0
- Classes: 4

### Classes

- `StatusFamilyFilter` : `admin.SimpleListFilter`
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
- `HasActorFilter` : `admin.SimpleListFilter`
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
- `HasRequestIdFilter` : `admin.SimpleListFilter`
  - Methods: 2
  - `lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[Any, str]]`
  - `queryset(self, request: HttpRequest, queryset: QuerySet[Any] | None) -> QuerySet[Any] | None`
- `AuditEventAdmin` : `admin.ModelAdmin`
  - Methods: 23
  - `short_path(self, obj)`
  - `has_add_permission(self, request)`
  - `has_change_permission(self, request, obj=None)`
  - `has_delete_permission(self, request, obj=None)`
  - `export_selected_as_csv(self, _request, queryset)`
  - `export_selected_as_json(self, _request, queryset)`
  - `export_selected_as_jsonl(self, _request, queryset)`
  - `get_urls(self)`
  - `changelist_view(self, request: HttpRequest, extra_context: dict[str, Any] | None=None)`
  - `export_view(self, request)`
  - `_get_filtered_queryset(self, request)`
  - `_parse_iso_date(value: str | None, *, param: str) -> date | None`
  - `_parse_selected_ids(values: list[str]) -> list[int]`
  - `_parse_selected_only(value: str | None) -> bool`
  - `_apply_export_date_filters(self, queryset, request)`
  - `_apply_export_selected_filters(self, queryset, request)`
  - `_serialize_event(self, event: AuditEvent) -> dict[str, object]`
  - `_build_export_filename(self, export_format: str) -> str`
  - `_build_export_response(self, queryset, *, export_format: str) -> HttpResponse`
  - `_as_csv(self, queryset, *, filename: str) -> HttpResponse`
  - `_as_json(self, queryset, *, filename: str) -> HttpResponse`
  - `_as_jsonl(self, queryset, *, filename: str) -> HttpResponse`
  - `_json_default(value)`

## `backend/auditlog/interfaces/api.py`

- Functions: 4
- Classes: 0

### Functions

- `events_list_view(request)`
- `event_detail_view(_request, event_id: int)`
- `actions_view(request)`
- `username_history_view(request, user_id: int)`

## `backend/auditlog/interfaces/middleware.py`

- Functions: 0
- Classes: 1

### Classes

- `AuditHttpMiddleware`
  - Methods: 3
  - `__init__(self, get_response)`
  - `_should_skip(self, request) -> bool`
  - `__call__(self, request)`

## `backend/auditlog/interfaces/permissions.py`

- Functions: 0
- Classes: 1

### Classes

- `IsStaffAuditReader` : `BasePermission`
  - Methods: 1
  - `has_permission(self, request: Any, view: Any)`

## `backend/auditlog/interfaces/serializers.py`

- Functions: 0
- Classes: 2

### Classes

- `AuditEventSerializer` : `serializers.ModelSerializer`
  - Methods: 1
  - `get_actor(self, obj)`
- `UsernameHistorySerializer` : `serializers.Serializer`
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
  - Methods: 2
  - `add_arguments(self, parser)`
  - `handle(self, *args, **options)`

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
  - `test_direct_start_action_is_audited_for_actor(self)`

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

## `backend/chat/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `ChatConfig` : `AppConfig`
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
  - Проверяет лимит WebSocket-подключений по endpoint и IP.

### Classes

- `ChatConsumer` : `AsyncWebsocketConsumer`
  - WebSocket consumer for chat room messaging.
  - Methods: 30
  - `connect(self)`
  - `disconnect(self, code)`
  - `receive(self, text_data=None, bytes_data=None)`
  - `chat_message(self, event)`
  - `_idle_watchdog(self)`
  - `_load_room(self, room_id: int)`
  - `_can_read(self, room: Room, user) -> bool`
  - `_can_write(self, room: Room, user) -> bool`
  - `_resolve_public_username(self, user) -> str`
  - `_resolve_public_ref(self, user) -> str`
  - `_resolve_display_name(self, user) -> str`
  - `save_message(self, message, user, username, profile_pic, room, reply_to_id=None)`
  - `_get_profile_avatar_state(self, user)`
  - `_is_blocked_in_dm(self, room: Room, user) -> bool`
    - Проверяет блокировку между участниками в личном диалоге.
  - `_rate_limited(self, user) -> bool`
    - Проверяет лимит отправки сообщений для текущего пользователя.
  - `_rate_limit_retry_after_seconds(self, user) -> int | None`
    - Возвращает оставшееся время ожидания после rate limit.
  - `_chat_message_rate_limit_scope_key(user) -> str`
  - `_slow_mode_limited(self, user) -> bool`
    - Проверяет slow mode для группы по текущему пользователю.
  - `_handle_typing(self)`
  - `chat_typing(self, event)`
  - `_get_reply_data(self, saved_message)`
  - `chat_message_edit(self, event)`
  - `chat_message_delete(self, event)`
  - `chat_reaction_add(self, event)`
  - `chat_reaction_remove(self, event)`
  - `chat_read_receipt(self, event)`
  - `chat_membership_revoked(self, event)`
  - `_handle_mark_read(self, data)`
  - `_do_mark_read(self, user, room, last_read_id)`
  - `_build_direct_inbox_targets(self, room_id: int, sender_id: int, message: str, created_at: str)`

## `backend/chat/routing.py`

- Description: WebSocket routing for chat consumers.
- Functions: 0
- Classes: 0

## `backend/chat/services.py`

- Description: Business logic for message operations: edit, delete, reactions, read state.
- Functions: 11
- Classes: 4

### Functions

- `_attachment_delete_retry_delay(attempt: int) -> float`
- `_load_message_or_raise(room: Room, message_id: int) -> Message`
- `_can_manage_message(room: Room, user, message: Message) -> bool`
  - Check if user can edit/delete this message (author or moderator).
- `_within_edit_window(message: Message) -> bool`
- `_delete_attachment_blob(storage, blob_name: str | None, *, attachment_id: int, field_name: str) -> None`
- `edit_message(user, room: Room, message_id: int, new_content: str) -> Message`
  - Edit a message. Returns the updated message.
- `delete_message(user, room: Room, message_id: int) -> Message`
  - Soft-delete a message. Returns the deleted message.
- `add_reaction(user, room: Room, message_id: int, emoji: str) -> Reaction`
  - Add an emoji reaction to a message. Idempotent.
- `remove_reaction(user, room: Room, message_id: int, emoji: str) -> None`
  - Remove an emoji reaction. Idempotent (no error if not found).
- `mark_read(user, room: Room, last_read_message_id: int) -> MessageReadState`
  - Mark messages as read up to the given message ID.
- `get_unread_counts(user) -> list[dict]`
  - Get unread message counts for all rooms the user is a member of.

### Classes

- `MessageError` : `Exception`
  - Methods: 0
- `MessageNotFoundError` : `MessageError`
  - Methods: 0
- `MessageForbiddenError` : `MessageError`
  - Methods: 0
- `MessageValidationError` : `MessageError`
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
- `DirectApiTests` : `TestCase`
  - Methods: 8
  - `setUp(self)`
  - `_post_start(self, ref: str)`
  - `test_start_requires_auth(self)`
  - `test_start_rejects_self(self)`
  - `test_start_rejects_missing_user(self)`
  - `test_start_supports_public_handle_with_at(self)`
  - `test_repeated_start_returns_same_room_id(self)`
  - `test_direct_chats_include_dialog_after_start(self)`
- `ChatApiExtraCoverageTests` : `TestCase`
  - Methods: 7
  - `setUp(self)`
  - `_post_direct_start(self, ref: str)`
  - `test_direct_start_accepts_form_payload(self)`
  - `test_direct_start_returns_503_when_room_creation_fails(self)`
  - `test_direct_start_returns_503_when_role_assignment_fails(self)`
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
  - `test_slug_validation_handles_invalid_regex(self)`
    - Проверяет сценарий `test_slug_validation_handles_invalid_regex`.
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
  - Methods: 38
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
  - `test_mark_read_validation_public_short_circuit_and_unread_counts(self)`

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
  - Methods: 18
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
  - `test_mark_read_retries_and_raises_operational_error(self)`
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

- `is_valid_room_slug(value: str) -> bool`

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
  - Returns liveness status.
- `ready(_request)`
  - Returns readiness status for database and cache dependencies.

## `backend/chat_app_django/http_utils.py`

- Description: Общие HTTP-утилиты для API-слоя: парсинг payload и единые ошибки.
- Functions: 2
- Classes: 0

### Functions

- `parse_request_payload(request) -> Mapping[str, object]`
  - Возвращает словарь payload из JSON или form-data без выбрасывания ошибок наружу.
- `error_response(*, status: int, error: str | None=None, detail: str | None=None, errors: Mapping[str, list[str] | str] | None=None) -> Response`
  - Формирует единый JSON-ответ ошибки в формате error/detail/errors.

## `backend/chat_app_django/ip_utils.py`

- Description: Содержит логику модуля `ip_utils` подсистемы `chat_app_django`.
- Functions: 8
- Classes: 0

### Functions

- `_decode_header(value: bytes | None) -> str | None`
  - Выполняет логику `_decode_header` с параметрами из сигнатуры.
- `_first_value(value: str | None) -> str | None`
  - Выполняет логику `_first_value` с параметрами из сигнатуры.
- `_parse_ip(value: str | None) -> str | None`
  - Выполняет логику `_parse_ip` с параметрами из сигнатуры.
- `_trusted_networks() -> list`
  - Выполняет логику `_trusted_networks` с параметрами из сигнатуры.
- `is_trusted_proxy(ip: str | None) -> bool`
  - Выполняет логику `is_trusted_proxy` с параметрами из сигнатуры.
- `_pick_ip(candidates: list[str | None]) -> str | None`
  - Выполняет логику `_pick_ip` с параметрами из сигнатуры.
- `get_client_ip_from_request(request) -> str | None`
  - Выполняет логику `get_client_ip_from_request` с параметрами из сигнатуры.
- `get_client_ip_from_scope(scope) -> str | None`
  - Выполняет логику `get_client_ip_from_scope` с параметрами из сигнатуры.

## `backend/chat_app_django/media_utils.py`

- Description: Утилиты media URL: signed-ссылки, room-scoped ссылки и crop аватарок.
- Functions: 23
- Classes: 0

### Functions

- `serialize_avatar_crop(profile) -> dict[str, float] | None`
  - Serialize avatar crop metadata into a unified API format.
- `_decode_header(value: bytes | None) -> str | None`
- `_get_header(scope, name: bytes) -> str | None`
- `_first_value(value: str | None) -> str | None`
- `_normalize_scheme(value: str | None) -> str | None`
- `_normalize_base_url(value: str | None) -> str | None`
- `_base_from_host_and_scheme(host: str | None, scheme: str | None) -> str | None`
- `normalize_media_path(image_name: str | None) -> str | None`
  - Normalize media path and reject traversal/empty values.
- `_is_internal_host(hostname: str | None) -> bool`
- `_hostname_from_base(base: str | None) -> str | None`
- `_should_prefer_origin(candidate_base: str | None, origin_base: str | None) -> bool`
- `_pick_base_url(configured_base: str | None, forwarded_base: str | None, host_base: str | None, origin_base: str | None) -> str | None`
- `_coerce_media_source(image_name: str | None, trusted_hosts: set[str] | None=None) -> str | None`
- `_media_signing_key() -> bytes`
- `_media_signature(path: str, expires_at: int) -> str`
- `is_valid_media_signature(path: str, expires_at: int, signature: str | None) -> bool`
  - Validate HMAC signature for a signed media URL.
- `_signed_media_url_path(image_name: str | None, expires_at: int | None=None) -> str | None`
- `is_chat_attachment_media_path(path: str | None) -> bool`
- `_parse_positive_room_id(room_id: int | str | None) -> int | None`
- `_room_scoped_media_url_path(image_name: str | None, room_id: int | str | None) -> str | None`
- `build_room_media_url_from_request(request, image_name: str | None, room_id: int | str | None) -> str | None`
  - Build absolute room-scoped URL for chat attachments and thumbnails.
- `build_profile_url_from_request(request, image_name: str | None) -> str | None`
  - Build absolute avatar URL using HTTP request headers.
- `build_profile_url(scope, image_name: str | None) -> str | None`
  - Build absolute avatar URL for WebSocket ASGI scope.

## `backend/chat_app_django/meta_api.py`

- Description: Read-only meta endpoints for frontend runtime configuration.
- Functions: 1
- Classes: 0

### Functions

- `client_config_view(_request)`
  - Returns client-facing limits and policies from backend settings.

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
  - Policy with request limit and window in seconds.
  - Methods: 2
  - `normalized_limit(self) -> int`
    - Return a safe limit value (minimum 1).
  - `normalized_window(self) -> int`
    - Return a safe window value (minimum 1 second).
- `DbRateLimiter`
  - Atomic DB-based rate limiter.
  - Methods: 2
  - `is_limited(cls, scope_key: str, policy: RateLimitPolicy) -> bool`
    - Increment bucket and return whether the scope is currently limited.
  - `retry_after_seconds(cls, scope_key: str) -> int | None`
    - Return remaining bucket lifetime in seconds for `scope_key`.

## `backend/chat_app_django/security/rate_limit_config.py`

- Description: Centralized rate-limit policy readers. This module is the single architecture entry point for reading runtime rate-limit configuration from Django settings. Why it exists: - keep policy lookup in one place; - avoid duplicating env/default logic across consumers and APIs; - read all rate-limit policies from the unified RATE_LIMITS mapping.
- Functions: 8
- Classes: 0

### Functions

- `_positive_int(value: Any, fallback: int) -> int`
- `_rate_limits_mapping() -> Mapping[str, Any]`
- `_section(name: str) -> Mapping[str, Any]`
- `_section_policy(*, section_name: str, default_limit: int, default_window: int) -> RateLimitPolicy`
- `auth_rate_limit_policy() -> RateLimitPolicy`
  - Policy for auth attempts (login/register), scoped per action and IP.
- `chat_message_rate_limit_policy() -> RateLimitPolicy`
  - Policy for chat message send throttle, scoped per user.
- `ws_connect_rate_limit_policy(endpoint: str) -> RateLimitPolicy`
  - Policy for websocket connect throttle, scoped per endpoint and IP.
- `ws_connect_rate_limit_disabled() -> bool`
  - Global switch for websocket connect throttling.

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
  - `test_direct_start_form_shows_ref_for_authenticated_user(self)`
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
  - Methods: 8
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
  - `test_request_falls_back_to_remote_when_forwarded_is_invalid(self)`
    - Проверяет сценарий `test_request_falls_back_to_remote_when_forwarded_is_invalid`.
  - `test_scope_uses_forwarded_when_proxy_trusted(self)`
    - Проверяет сценарий `test_scope_uses_forwarded_when_proxy_trusted`.
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
- `_link(request, name: str, kwargs: dict | None=None) -> str | None`
- `_first_link(request, names: list[str]) -> str | None`
- `api_index(request)`
  - Returns API index with clickable links for manual testing.
- `api_root(request)`
  - Returns project root status and pointer to API index.

## `backend/chat_app_django/wsgi.py`

- Description: Содержит логику модуля `wsgi` подсистемы `chat_app_django`.
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
- `_ws_connect_rate_limited(scope, endpoint: str) -> bool`
  - Checks websocket connect rate limit per endpoint and IP.

### Classes

- `DirectInboxConsumer` : `AsyncWebsocketConsumer`
  - Manages unread/active state for direct message conversations.
  - Methods: 22
  - `connect(self)`
  - `disconnect(self, code)`
  - `receive(self, text_data=None, bytes_data=None)`
  - `direct_inbox_event(self, event)`
  - `_send_unread_state(self)`
  - `_send_error(self, code: str)`
  - `_heartbeat(self)`
  - `_idle_watchdog(self)`
  - `_load_room_sync(self, room_id: int) -> Room | None`
  - `_load_room(self, room_id: int) -> Room | None`
  - `_can_read_sync(self, room: Room) -> bool`
  - `_can_read(self, room: Room) -> bool`
  - `_get_unread_state_sync(self) -> dict[str, Any]`
  - `_get_unread_state(self) -> dict[str, Any]`
  - `_mark_read_sync(self, room_id: int) -> dict[str, Any]`
  - `_mark_read(self, room_id: int) -> dict[str, Any]`
  - `_set_active_room_sync(self, room_id: int) -> None`
  - `_set_active_room(self, room_id: int) -> None`
  - `_clear_active_room_sync(self, conn_only: bool=False) -> None`
  - `_clear_active_room(self, conn_only: bool=False) -> None`
  - `_touch_active_room_sync(self) -> None`
  - `_touch_active_room(self) -> None`

## `backend/direct_inbox/routing.py`

- Description: WebSocket routing for direct inbox consumers.
- Functions: 0
- Classes: 0

## `backend/direct_inbox/state.py`

- Description: Cache-backed unread/active state for direct messages.
- Functions: 15
- Classes: 0

### Functions

- `user_group_name(user_id: int) -> str`
- `unread_key(user_id: int) -> str`
- `active_key(user_id: int) -> str`
- `_normalize_room_ids(value: Any) -> list[int]`
- `_normalize_counts(value: Any) -> dict[str, int]`
- `_counts_to_room_ids(counts: dict[str, int]) -> list[int]`
- `_parse_positive_room_id(value: int | str | None) -> int | None`
- `get_unread_room_ids(user_id: int) -> list[int]`
- `get_unread_state(user_id: int) -> dict[str, Any]`
- `mark_unread(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]`
- `mark_read(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]`
- `set_active_room(user_id: int, room_id: int, conn_id: str, ttl_seconds: int) -> None`
- `touch_active_room(user_id: int, conn_id: str, ttl_seconds: int) -> None`
- `clear_active_room(user_id: int, conn_id: str | None=None) -> None`
- `is_room_active(user_id: int, room_id: int) -> bool`

## `backend/friends/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/admin.py`

- Functions: 0
- Classes: 1

### Classes

- `FriendshipAdmin` : `admin.ModelAdmin`
  - Methods: 8
  - `from_user_id_value(self, obj: Friendship) -> int | None`
  - `to_user_id_value(self, obj: Friendship) -> int | None`
  - `_set_status(self, queryset, status: str) -> int`
  - `mark_pending(self, request, queryset)`
  - `mark_accepted(self, request, queryset)`
  - `mark_declined(self, request, queryset)`
  - `mark_blocked(self, request, queryset)`
  - `make_mutual_accepted(self, request, queryset)`

## `backend/friends/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/application/errors.py`

- Description: Typed application errors for friend management use-cases.
- Functions: 0
- Classes: 4

### Classes

- `FriendServiceError` : `Exception`
  - Methods: 1
  - `__init__(self, message: str)`
- `FriendNotFoundError` : `FriendServiceError`
  - Methods: 0
- `FriendForbiddenError` : `FriendServiceError`
  - Methods: 0
- `FriendConflictError` : `FriendServiceError`
  - Methods: 0

## `backend/friends/application/friend_service.py`

- Description: Friend management use-cases.
- Functions: 16
- Classes: 0

### Functions

- `_ensure_authenticated(actor) -> None`
- `_normalize_public_ref(raw: str) -> str`
- `_friend_from_user_id(friendship: Friendship) -> int`
- `_friend_to_user_id(friendship: Friendship) -> int`
- `list_friends(actor) -> list`
- `list_incoming_requests(actor) -> list`
- `list_outgoing_requests(actor) -> list`
- `list_blocked(actor) -> list`
- `is_blocked_between(user_a, user_b) -> bool`
  - Return True if either user has blocked the other.
- `send_request(actor, target_ref: str) -> Friendship`
- `accept_request(actor, friendship_id: int) -> Friendship`
- `decline_request(actor, friendship_id: int) -> Friendship`
- `cancel_outgoing_request(actor, friendship_id: int) -> Friendship`
- `remove_friend(actor, target_user_id: int) -> None`
- `block_user(actor, target_ref: str) -> Friendship`
- `unblock_user(actor, target_user_id: int) -> None`

## `backend/friends/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `FriendsConfig` : `AppConfig`
  - Methods: 1
  - `ready(self)`

## `backend/friends/domain/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/domain/rules.py`

- Description: Pure domain rules for friendship logic.
- Functions: 5
- Classes: 0

### Functions

- `is_self_request(actor_id: int, target_id: int) -> bool`
- `can_send_request(*, existing_outgoing_status: str | None, existing_incoming_status: str | None) -> tuple[bool, str]`
  - Check if a friend request can be sent. Returns (allowed, reason).
- `should_auto_accept(existing_incoming_status: str | None) -> bool`
  - If the target already sent us a pending request, auto-accept both.
- `can_accept_request(*, request_to_user_id: int, actor_id: int) -> bool`
  - Only the recipient can accept a request.
- `can_decline_request(*, request_to_user_id: int, actor_id: int) -> bool`
  - Only the recipient can decline a request.

## `backend/friends/infrastructure/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/infrastructure/repositories.py`

- Description: ORM repositories for friendship queries.
- Functions: 9
- Classes: 0

### Functions

- `get_user_by_public_ref(public_ref: str)`
- `get_user_by_id(user_id: int)`
- `get_friendship(from_user, to_user) -> Friendship | None`
- `get_friendship_by_id(friendship_id: int) -> Friendship | None`
- `list_friends_for_user(user) -> QuerySet`
  - Return accepted friendships where user is from_user (the paired row).
- `list_pending_incoming(user) -> QuerySet`
- `list_pending_outgoing(user) -> QuerySet`
- `list_blocked_by_user(user) -> QuerySet`
- `delete_friendship_pair(user_a, user_b, *, status: str | None=None) -> int`
  - Delete both directions of a friendship with optional status filter.

## `backend/friends/interfaces/__init__.py`

- Functions: 0
- Classes: 0

## `backend/friends/interfaces/serializers.py`

- Description: Serializers for friend management HTTP API.
- Functions: 3
- Classes: 6

### Functions

- `_require_from_user_id(obj: Friendship) -> int`
- `_require_to_user_id(obj: Friendship) -> int`
- `_serialize_user_brief(user, request) -> dict`

### Classes

- `_UserBriefSerializer` : `serializers.Serializer`
  - Methods: 0
- `FriendOutputSerializer` : `serializers.ModelSerializer`
  - Serializes an accepted friendship — shows the friend (to_user).
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
- `IncomingRequestOutputSerializer` : `serializers.ModelSerializer`
  - Serializes incoming pending request — shows who sent it (from_user).
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
- `OutgoingRequestOutputSerializer` : `serializers.ModelSerializer`
  - Serializes outgoing pending request — shows target (to_user).
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
- `BlockedOutputSerializer` : `serializers.ModelSerializer`
  - Serializes a blocked user — shows who is blocked (to_user).
  - Methods: 1
  - `get_user(self, obj: Friendship) -> dict`
- `PublicRefInputSerializer` : `serializers.Serializer`
  - Methods: 1
  - `validate(self, attrs)`

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

### Classes

- `FriendListApiView` : `APIView`
  - Methods: 1
  - `get(self, request)`
- `IncomingRequestsApiView` : `APIView`
  - Methods: 1
  - `get(self, request)`
- `OutgoingRequestsApiView` : `APIView`
  - Methods: 1
  - `get(self, request)`
- `SendRequestApiView` : `GenericAPIView`
  - Methods: 2
  - `get(self, _request)`
  - `post(self, request)`
- `AcceptRequestApiView` : `APIView`
  - Methods: 1
  - `post(self, request, friendship_id: int)`
- `DeclineRequestApiView` : `APIView`
  - Methods: 1
  - `post(self, request, friendship_id: int)`
- `CancelOutgoingRequestApiView` : `APIView`
  - Methods: 1
  - `delete(self, request, friendship_id: int)`
- `RemoveFriendApiView` : `APIView`
  - Methods: 1
  - `delete(self, request, user_id: int)`
- `BlockedListApiView` : `APIView`
  - Methods: 1
  - `get(self, request)`
- `BlockUserApiView` : `GenericAPIView`
  - Methods: 2
  - `get(self, _request)`
  - `post(self, request)`
- `UnblockUserApiView` : `APIView`
  - Methods: 1
  - `delete(self, request, user_id: int)`

## `backend/friends/models.py`

- Description: Friendship model — one row per direction (A→B).
- Functions: 0
- Classes: 1

### Classes

- `Friendship` : `models.Model`
  - Methods: 1
  - `__str__(self)`

## `backend/friends/signals.py`

- Functions: 2
- Classes: 0

### Functions

- `audit_friendship_save(sender, instance: Friendship, created: bool, **kwargs)`
- `audit_friendship_delete(sender, instance: Friendship, **kwargs)`

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
- `get_to_user_id(obj: Friendship) -> int | None`

## `backend/groups/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `GroupsConfig` : `AppConfig`
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
  - A shareable link to join a group.
  - Methods: 2
  - `__str__(self)`
  - `is_expired(self) -> bool`
- `JoinRequest` : `models.Model`
  - A pending request to join a group that requires admin approval.
  - Methods: 1
  - `__str__(self)`
- `PinnedMessage` : `models.Model`
  - A message pinned in a group.
  - Methods: 1
  - `__str__(self)`

## `backend/groups/interfaces/__init__.py`

- Functions: 0
- Classes: 0

## `backend/groups/interfaces/serializers.py`

- Description: DRF serializers for the groups API.
- Functions: 0
- Classes: 15

### Classes

- `GroupCreateInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `GroupUpdateInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `GroupOutputSerializer` : `serializers.Serializer`
  - Methods: 0
- `GroupListItemSerializer` : `serializers.Serializer`
  - Methods: 0
- `InviteCreateInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `InviteOutputSerializer` : `serializers.Serializer`
  - Methods: 1
  - `get_createdBy(self, obj)`
- `InvitePreviewSerializer` : `serializers.Serializer`
  - Methods: 0
- `MemberOutputSerializer` : `serializers.Serializer`
  - Methods: 0
- `BannedMemberSerializer` : `serializers.Serializer`
  - Methods: 0
- `BanInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `MuteInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `JoinRequestOutputSerializer` : `serializers.Serializer`
  - Methods: 0
- `PinInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `PinOutputSerializer` : `serializers.Serializer`
  - Methods: 0
- `TransferOwnershipInputSerializer` : `serializers.Serializer`
  - Methods: 0

## `backend/groups/interfaces/views.py`

- Description: REST API views for the groups subsystem.
- Functions: 27
- Classes: 8

### Functions

- `_error(msg: str, code: int=400) -> Response`
- `_validated_data(serializer: Any) -> dict[str, Any]`
- `_parse_positive_int(raw_value: str | None, param_name: str) -> int`
- `_handle_group_errors(func)`
  - Decorator to handle common group service errors.
- `create_group(request)`
- `list_public_groups(request)`
- `list_my_groups(request)`
- `group_detail(request, room_id)`
- `join_group(request, room_id)`
- `leave_group(request, room_id)`
- `list_members(request, room_id)`
- `kick_member(request, room_id, user_id)`
- `ban_member(request, room_id, user_id)`
- `unban_member(request, room_id, user_id)`
- `mute_member(request, room_id, user_id)`
- `unmute_member(request, room_id, user_id)`
- `list_banned(request, room_id)`
- `group_invites(request, room_id)`
- `revoke_invite(request, room_id, code)`
- `invite_preview(request, code)`
- `join_via_invite(request, code)`
- `list_join_requests(request, room_id)`
- `approve_join_request(request, room_id, request_id)`
- `reject_join_request(request, room_id, request_id)`
- `group_pins(request, room_id)`
- `unpin_message(request, room_id, message_id)`
- `transfer_ownership(request, room_id)`

### Classes

- `_HandledGroupAPIView` : `GenericAPIView`
  - Methods: 1
  - `_execute(self, handler)`
- `GroupCreateInteractiveView` : `_HandledGroupAPIView`
  - Methods: 1
  - `post(self, request)`
- `GroupDetailInteractiveView` : `_HandledGroupAPIView`
  - Methods: 3
  - `get(self, request, room_id)`
  - `patch(self, request, room_id)`
  - `delete(self, request, room_id)`
- `BanMemberInteractiveView` : `_HandledGroupAPIView`
  - Methods: 1
  - `post(self, request, room_id, user_id)`
- `MuteMemberInteractiveView` : `_HandledGroupAPIView`
  - Methods: 1
  - `post(self, request, room_id, user_id)`
- `GroupInvitesInteractiveView` : `_HandledGroupAPIView`
  - Methods: 2
  - `get(self, request, room_id)`
  - `post(self, request, room_id)`
- `GroupPinsInteractiveView` : `_HandledGroupAPIView`
  - Methods: 2
  - `get(self, request, room_id)`
  - `post(self, request, room_id)`
- `TransferOwnershipInteractiveView` : `_HandledGroupAPIView`
  - Methods: 1
  - `post(self, request, room_id)`

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
  - Methods: 6
  - `test_generate_invite_code_uses_configured_length(self)`
  - `test_validate_group_name(self)`
  - `test_validate_group_username(self)`
  - `test_validate_description_and_slow_mode(self)`
  - `test_ensure_is_group(self)`
  - `test_generate_group_slug_handles_short_and_long_names(self)`

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

- Description: Содержит логику модуля `manage` подсистемы `manage.py`.
- Functions: 1
- Classes: 0

### Functions

- `main()`
  - Выполняет логику `main` с параметрами из сигнатуры.

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
  - Methods: 1
  - `short_message(self, obj)`

## `backend/messages/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `MessagesConfig` : `AppConfig`
  - Methods: 0

## `backend/messages/models.py`

- Functions: 0
- Classes: 4

### Classes

- `Message` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `Reaction` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `MessageAttachment` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `MessageReadState` : `models.Model`
  - Methods: 1
  - `__str__(self)`

## `backend/messages/serializers.py`

- Functions: 0
- Classes: 4

### Classes

- `AttachmentSerializer` : `serializers.ModelSerializer`
  - Methods: 3
  - `_build_url(self, field_file, obj)`
  - `get_url(self, obj)`
  - `get_thumbnailUrl(self, obj)`
- `MessageSerializer` : `serializers.ModelSerializer`
  - Methods: 7
  - `get_profilePic(self, obj)`
  - `get_publicRef(self, obj)`
  - `get_displayName(self, obj)`
  - `get_avatarCrop(self, obj)`
  - `get_replyTo(self, obj)`
  - `get_reactions(self, obj)`
  - `to_representation(self, instance)`
- `MessageCreateSerializer` : `serializers.Serializer`
  - Methods: 0
- `MessagePaginationSerializer` : `serializers.Serializer`
  - Methods: 0

## `backend/messages/thumbnail.py`

- Description: Thumbnail generation for chat image attachments.
- Functions: 1
- Classes: 0

### Functions

- `generate_thumbnail(source_field) -> dict | None`
  - Generate a thumbnail for an image file field. Returns dict with 'path' (ContentFile), 'width', 'height' or None on failure.

## `backend/presence/__init__.py`

- Functions: 0
- Classes: 0

## `backend/presence/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `PresenceConfig` : `AppConfig`
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
- `_ws_connect_rate_limited(scope, endpoint: str) -> bool`
  - Checks websocket connect rate limit per endpoint and IP.

### Classes

- `PresenceConsumer` : `AsyncWebsocketConsumer`
  - Tracks user online/offline presence via WebSocket.
  - Methods: 28
  - `connect(self)`
  - `disconnect(self, code)`
  - `receive(self, text_data=None, bytes_data=None)`
  - `_broadcast(self)`
  - `presence_update(self, event)`
  - `_heartbeat(self)`
  - `_idle_watchdog(self)`
  - `_normalize_presence_value(value: object) -> str`
  - `_coerce_presence_int(value: object, default: int=0) -> int`
  - `_resolve_presence_user_identity(self, user: Any) -> tuple[str, str, str]`
  - `_resolve_presence_entry(data: dict[str, dict[str, object]], *, key: str, username: str) -> tuple[str, dict[str, object] | None]`
  - `_add_user_sync(self, user: Any) -> None`
  - `_add_user(self, user: Any) -> None`
  - `_remove_user_sync(self, user: Any, graceful: bool=False) -> None`
  - `_remove_user(self, user: Any, graceful: bool=False) -> None`
  - `_get_online_sync(self) -> list[dict[str, object]]`
  - `_get_online(self) -> list[dict[str, object]]`
  - `_add_guest_sync(self, ip: str | None) -> None`
  - `_add_guest(self, ip: str | None) -> None`
  - `_remove_guest_sync(self, ip: str | None, graceful: bool=False) -> None`
  - `_remove_guest(self, ip: str | None, graceful: bool=False) -> None`
  - `_get_guest_count_sync(self) -> int`
  - `_get_guest_count(self) -> int`
  - `_touch_user_sync(self, user: Any) -> None`
  - `_touch_user(self, user: Any) -> None`
  - `_touch_guest_sync(self, ip: str | None) -> None`
  - `_touch_guest(self, ip: str | None) -> None`
  - `_get_guest_session_key(self) -> str | None`
    - Returns guest session key from scope when session is initialized.

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

### Classes

- `RoleAdmin` : `admin.ModelAdmin`
  - Methods: 1
  - `permission_flags(self, obj: Role) -> str`
- `MembershipAdmin` : `admin.ModelAdmin`
  - Methods: 1
  - `role_names(self, obj: Membership) -> str`
- `PermissionOverrideAdmin` : `admin.ModelAdmin`
  - Methods: 2
  - `allow_flags(self, obj: PermissionOverride) -> str`
  - `deny_flags(self, obj: PermissionOverride) -> str`

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
  - Methods: 1
  - `__init__(self, message: str)`
- `RoleNotFoundError` : `RoleServiceError`
  - Methods: 0
- `RoleForbiddenError` : `RoleServiceError`
  - Methods: 0
- `RoleConflictError` : `RoleServiceError`
  - Methods: 0

## `backend/roles/application/management_service.py`

- Description: Role, membership and override management use-cases.
- Functions: 27
- Classes: 1

### Functions

- `_audit_role_denied(room: Room | None, actor, reason: str) -> None`
- `_load_room_or_raise(room_id: int) -> Room`
- `_ensure_authenticated(actor) -> None`
- `_ensure_manage_roles(room: Room, actor) -> ActorContext`
- `_ensure_not_direct(room: Room) -> None`
- `_ensure_manage_target_position(actor_context: ActorContext, *, target_position: int) -> None`
- `_ensure_permissions_subset(actor_context: ActorContext, *, candidate_permissions: int) -> None`
- `_membership_top_position(membership: Membership | None) -> int`
- `_obj_pk(value: object, *, field_name: str='object') -> int`
- `_membership_user_id(membership: Membership) -> int`
- `_override_target_role_id(override: PermissionOverride) -> int | None`
- `_override_target_user_id(override: PermissionOverride) -> int | None`
- `_ensure_manage_member(actor_context: ActorContext, membership: Membership) -> None`
- `actor_can_manage_roles(room_id: int, actor) -> bool`
- `_room_actor_context_or_raise(room_id: int, actor) -> RoomActorContext`
- `list_room_roles(room_id: int, actor)`
- `create_room_role(room_id: int, actor, *, name: str, color: str, position: int, permissions: int) -> Role`
- `update_room_role(room_id: int, role_id: int, actor, *, name: str | None=None, color: str | None=None, position: int | None=None, permissions: int | None=None) -> Role`
- `delete_room_role(room_id: int, role_id: int, actor) -> None`
- `get_member_roles(room_id: int, user_id: int, actor) -> Membership`
- `set_member_roles(room_id: int, user_id: int, actor, role_ids: list[int]) -> Membership`
- `list_room_overrides(room_id: int, actor)`
- `_resolve_override_target(*, room: Room, actor_context: ActorContext, target_role_id: int | None, target_user_id: int | None) -> tuple[Role | None, Membership | None]`
- `create_room_override(room_id: int, actor, *, target_role_id: int | None, target_user_id: int | None, allow: int, deny: int) -> PermissionOverride`
- `update_room_override(room_id: int, override_id: int, actor, *, allow: int | None=None, deny: int | None=None) -> PermissionOverride`
- `delete_room_override(room_id: int, override_id: int, actor) -> None`
- `permissions_for_me(room_id: int, actor) -> dict[str, object]`

### Classes

- `RoomActorContext`
  - Methods: 0

## `backend/roles/application/permission_service.py`

- Description: Permission computation and read-only role access checks.
- Functions: 17
- Classes: 1

### Functions

- `_is_superuser(user) -> bool`
- `_role_pk(role) -> int | None`
- `_membership_user_id(membership) -> int | None`
- `_override_target_role_id(override) -> int | None`
- `_override_target_user_id(override) -> int | None`
- `_top_role_position_for_membership(membership) -> int`
- `_compute_direct_permissions(room: Room, user) -> Perm`
- `_get_default_everyone_permissions(room: Room) -> int`
  - Determine fallback @everyone permissions when no default role exists.
- `compute_permissions(room: Room, user) -> Perm`
  - Computes effective permissions for a user in a room.
- `has_permission(room: Room, user, perm: Perm) -> bool`
- `can_read(room: Room, user) -> bool`
- `can_write(room: Room, user) -> bool`
- `ensure_can_read_or_404(room: Room, user) -> None`
- `ensure_can_write(room: Room, user) -> bool`
- `get_user_role(room: Room, user) -> str | None`
- `get_actor_context(room: Room, actor) -> ActorContext`
- `can_manage_roles(room: Room, actor) -> bool`

### Classes

- `ActorContext`
  - Methods: 0

## `backend/roles/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `RolesConfig` : `AppConfig`
  - Methods: 1
  - `ready(self)`

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
  - Parses `direct_pair_key` into two user ids.
- `direct_access_allowed(*, user_id: int | None, pair: tuple[int, int] | None, membership_user_ids: set[int], banned_user_ids: set[int]) -> bool`
  - Checks strict DM access invariant: pair_key + membership + not banned.
- `resolve_permissions(*, everyone_permissions: int, role_permissions: Iterable[int], role_overrides: Iterable[tuple[int, int]], user_overrides: Iterable[tuple[int, int]]) -> Perm`
  - Resolves effective permissions using Discord-style precedence.
- `is_permission_subset(*, candidate: int, holder: int) -> bool`
  - True when all candidate bits are included in holder bits.
- `can_manage_target(*, actor_top_position: int, target_position: int) -> bool`
  - Hierarchy rule: actor can only manage roles strictly below self.
- `normalize_role_ids(raw_role_ids: Iterable[int | str]) -> list[int]`
  - Normalizes list of positive role ids while preserving input order.
- `validate_override_target_ids(target_role_id: int | None, target_user_id: int | None) -> bool`
  - True when exactly one override target is provided.
- `has_manage_roles(permissions: int) -> bool`
  - Checks MANAGE_ROLES bit in effective permissions.
- `role_is_protected(*, is_default: bool, name: str) -> bool`
  - Returns True for system roles that cannot be removed/broken.

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
- `get_default_role_permissions(room: Room) -> int | None`
- `get_membership(room: Room, user) -> Membership | None`
- `get_membership_by_user_id(room: Room, user_id: int) -> Membership | None`
- `list_memberships(room: Room) -> QuerySet[Membership]`
- `list_roles(room: Room) -> QuerySet[Role]`
- `get_role(room: Room, role_id: int) -> Role | None`
- `list_overrides(room: Room) -> QuerySet[PermissionOverride]`
- `get_override(room: Room, override_id: int) -> PermissionOverride | None`
- `get_user_by_id(user_id: int)`

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
  - Allows access only to users with MANAGE_ROLES in the room.
  - Methods: 1
  - `has_permission(self, request: Any, view: Any)`

## `backend/roles/interfaces/serializers.py`

- Description: Serializers for role-management HTTP API.
- Functions: 0
- Classes: 8

### Classes

- `RoleOutputSerializer` : `serializers.ModelSerializer`
  - Methods: 0
- `RoleCreateInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `RoleUpdateInputSerializer` : `serializers.Serializer`
  - Methods: 1
  - `validate(self, attrs)`
- `MemberRolesOutputSerializer` : `serializers.ModelSerializer`
  - Methods: 2
  - `get_roleIds(self, obj: Membership) -> list[int]`
  - `get_username(self, obj: Membership) -> str`
- `MemberRolesUpdateInputSerializer` : `serializers.Serializer`
  - Methods: 0
- `OverrideOutputSerializer` : `serializers.ModelSerializer`
  - Methods: 0
- `OverrideCreateInputSerializer` : `serializers.Serializer`
  - Methods: 1
  - `validate(self, attrs)`
- `OverrideUpdateInputSerializer` : `serializers.Serializer`
  - Methods: 1
  - `validate(self, attrs)`

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
  - A named role with a permission bitmask, scoped to a room.
  - Methods: 2
  - `__str__(self)`
  - `create_defaults_for_room(cls, room: Room) -> dict[str, 'Role']`
    - Create the standard role set for a non-DM room. Returns a dict keyed by canonical name: {"@everyone": ..., "Viewer": ..., "Member": ..., "Moderator": ..., "Admin": ..., "Owner": ...}
- `Membership` : `models.Model`
  - Links a user to a room with optional roles and ban state. For direct chats, membership is created with no roles — access is purely based on Room.direct_pair_key.
  - Methods: 3
  - `__str__(self)`
  - `display_name(self) -> str`
    - Returns nickname if set, otherwise username.
  - `is_muted(self) -> bool`
- `PermissionOverride` : `models.Model`
  - Per-role or per-user permission override within a room. Works like Discord channel permission overrides: - `allow` bits are added on top of computed permissions. - `deny` bits are removed from computed permissions. - User-level overrides take precedence over role-level.
  - Methods: 1
  - `__str__(self)`

## `backend/roles/permissions.py`

- Description: Discord-style bitwise permission system. Each permission is a single bit in a 64-bit integer. Roles store a bitmask of granted permissions. Resolution: base(@everyone) | role1 | role2 | ... → effective permissions. ADMINISTRATOR bypasses all checks.
- Functions: 1
- Classes: 1

### Functions

- `has_perm(permissions: int, perm: Perm) -> bool`
  - Check if a permission bitmask includes the given permission.

### Classes

- `Perm` : `IntFlag`
  - Granular permission flags (Discord-inspired).
  - Methods: 0

## `backend/roles/signals.py`

- Functions: 4
- Classes: 0

### Functions

- `audit_membership_save(sender, instance: Membership, created: bool, **kwargs)`
- `audit_membership_delete(sender, instance: Membership, **kwargs)`
- `audit_role_save(sender, instance: Role, created: bool, **kwargs)`
- `audit_role_delete(sender, instance: Role, **kwargs)`

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

## `backend/rooms/admin.py`

- Functions: 0
- Classes: 3

### Classes

- `RoleInline` : `admin.TabularInline`
  - Methods: 0
- `PermissionOverrideInline` : `admin.TabularInline`
  - Methods: 0
- `RoomAdmin` : `admin.ModelAdmin`
  - Methods: 0

## `backend/rooms/apps.py`

- Functions: 0
- Classes: 1

### Classes

- `RoomsConfig` : `AppConfig`
  - Methods: 1
  - `ready(self)`

## `backend/rooms/serializers.py`

- Functions: 0
- Classes: 3

### Classes

- `RoomSerializer` : `serializers.ModelSerializer`
  - Methods: 1
  - `get_created_by(self, obj: Room)`
- `RoomDetailSerializer` : `serializers.Serializer`
  - Methods: 0
- `RoomPublicSerializer` : `serializers.Serializer`
  - Methods: 0

## `backend/rooms/services.py`

- Description: Business logic for room creation and direct messaging.
- Functions: 9
- Classes: 0

### Functions

- `direct_pair_key(user_a_id: int, user_b_id: int) -> str`
- `direct_room_slug(pair_key: str) -> str`
- `parse_pair_key_users(pair_key: str | None) -> tuple[int, int] | None`
- `ensure_membership(room: Room, user, role_name: str | None=None) -> Membership`
  - Get or create a Membership, optionally assigning a role by name. If the room has no roles yet, creates the default role set first.
- `ensure_room_owner(room: Room) -> None`
  - Ensure the room creator has Owner membership.
- `ensure_direct_memberships(room: Room, initiator, peer) -> None`
  - Create and normalize memberships for both DM participants. Direct rooms are strict: - `kind=direct`; - exactly two members from `direct_pair_key`; - no extra participants.
- `_create_or_get_direct_room(initiator, target, pair_key: str, slug: str)`
- `ensure_direct_room_with_retry(initiator, target, pair_key: str, slug: str)`
- `direct_peer_for_user(room: Room, user)`
  - Get the other participant in a direct room.

## `backend/rooms/signals.py`

- Description: Signals for room identity invariants.
- Functions: 1
- Classes: 0

### Functions

- `ensure_group_public_id_on_create(sender, instance: Room, **kwargs)`

## `backend/users/__init__.py`

- Description: Инициализирует пакет `users`.
- Functions: 0
- Classes: 0

## `backend/users/admin.py`

- Description: Содержит логику модуля `admin` подсистемы `users`.
- Functions: 0
- Classes: 5

### Classes

- `ProfileInlineForm` : `forms.ModelForm`
  - Инкапсулирует логику класса `ProfileInlineForm`.
  - Methods: 2
  - `__init__(self, *args, **kwargs)`
    - Инициализирует экземпляр `ProfileInlineForm`.
  - `save(self, commit=True)`
    - Выполняет логику `save` с параметрами из сигнатуры.
- `ProfileInline` : `admin.StackedInline`
  - Инкапсулирует логику класса `ProfileInline`.
  - Methods: 2
  - `username_display(self, obj)`
    - Выполняет логику `username_display` с параметрами из сигнатуры.
  - `avatar_preview(self, obj)`
    - Выполняет логику `avatar_preview` с параметрами из сигнатуры.
- `UserAdmin` : `BaseUserAdmin`
  - Инкапсулирует логику класса `UserAdmin`.
  - Methods: 1
  - `profile_last_seen(self, obj)`
    - Выполняет логику `profile_last_seen` с параметрами из сигнатуры.
- `ProfileAdminForm` : `ProfileInlineForm`
  - Инкапсулирует логику класса `ProfileAdminForm`.
  - Methods: 0
- `ProfileAdmin` : `admin.ModelAdmin`
  - Инкапсулирует логику класса `ProfileAdmin`.
  - Methods: 2
  - `is_staff(self, obj)`
    - Выполняет логику `is_staff` с параметрами из сигнатуры.
  - `avatar_preview(self, obj)`
    - Выполняет логику `avatar_preview` с параметрами из сигнатуры.

## `backend/users/application/__init__.py`

- Functions: 0
- Classes: 0

## `backend/users/application/media_access_service.py`

- Description: Сервис проверок доступа к защищенным media-файлам.
- Functions: 3
- Classes: 2

### Functions

- `_parse_positive_room_id(value: int | str | None) -> int | None`
  - Преобразует room_id в положительное целое или возвращает None.
- `resolve_media_content_type(normalized_path: str, *, preferred_content_type: str | None=None) -> str`
  - Определяет итоговый content type по метаданным и расширению файла.
- `resolve_attachment_media_access(*, normalized_path: str, room_id_raw: int | str | None, user: Any) -> AttachmentMediaAccessResult`
  - Проверяет доступ к вложению в комнате и возвращает метаданные выдачи.

### Classes

- `MediaAccessNotFoundError` : `Exception`
  - Файл недоступен в текущем контексте доступа.
  - Methods: 0
- `AttachmentMediaAccessResult`
  - Результат проверки room-scoped доступа для chat-вложений.
  - Methods: 0

## `backend/users/apps.py`

- Description: Содержит логику модуля `apps` подсистемы `users`.
- Functions: 0
- Classes: 1

### Classes

- `UsersConfig` : `AppConfig`
  - Инкапсулирует логику класса `UsersConfig`.
  - Methods: 1
  - `ready(self)`
    - Выполняет логику `ready` с параметрами из сигнатуры.

## `backend/users/avatar_service.py`

- Description: Единый сервис выбора источника аватара и сборки URL.
- Functions: 25
- Classes: 0

### Functions

- `_trimmed(value: Any) -> str`
  - Приводит значение к строке и обрезает пробелы.
- `_normalized_media_path(value: str | None) -> str`
  - Нормализует путь к media и гарантирует строковый результат.
- `_setting_media_path(name: str, default: str) -> str`
  - Читает путь из настроек и возвращает безопасное значение.
- `_setting_media_dir(name: str, default: str) -> str`
  - Читает директорию из настроек и убирает ведущие слеши.
- `user_password_default_avatar_path() -> str`
- `user_oauth_default_avatar_path() -> str`
- `group_default_avatar_path() -> str`
- `user_avatar_upload_dir() -> str`
- `group_avatar_upload_dir() -> str`
- `_safe_upload_filename(filename: str | None) -> str`
- `user_has_oauth_identity(user: Any) -> bool`
  - Проверяет наличие OAuth-идентичности у пользователя.
- `profile_avatar_upload_to(profile, filename: str) -> str`
  - Формирует путь сохранения пользовательской аватарки.
- `group_avatar_upload_to(_room, filename: str) -> str`
  - Формирует путь сохранения групповой аватарки.
- `_safe_profile(user: Any)`
  - Безопасно получает профиль пользователя без падений в рантайме.
- `_is_http_url(value: str) -> bool`
- `_is_same_media_file(path: str, candidate: str) -> bool`
- `_is_default_user_image(path: str) -> bool`
- `resolve_user_avatar_source(user: Any) -> str | None`
  - Возвращает источник аватара пользователя с учетом fallback-логики.
- `resolve_group_avatar_source(room: Any) -> str | None`
  - Возвращает источник аватара группы или дефолтную картинку.
- `resolve_avatar_url_from_request(request, source: str | None) -> str | None`
  - Собирает абсолютный URL аватара из HTTP-запроса.
- `resolve_avatar_url_from_scope(scope, source: str | None) -> str | None`
  - Собирает абсолютный URL аватара из ASGI scope.
- `resolve_user_avatar_url_from_request(request, user: Any) -> str | None`
- `resolve_user_avatar_url_from_scope(scope, user: Any) -> str | None`
- `resolve_group_avatar_url_from_request(request, room: Any) -> str | None`
- `resolve_group_avatar_url_from_scope(scope, room: Any) -> str | None`

## `backend/users/forms.py`

- Description: Формы для регистрации, профиля и публичного имени пользователя.
- Functions: 4
- Classes: 4

### Functions

- `_validate_username_symbols(username: str) -> None`
  - Проверяет допустимые символы и формат публичного имени.
- `_is_svg_upload(uploaded_file) -> bool`
  - Определяет SVG по расширению или content_type.
- `_read_uploaded_bytes(uploaded_file) -> bytes`
  - Читает файл и возвращает исходные байты с восстановлением указателя.
- `_validate_svg_avatar(uploaded_file) -> None`
  - Проверяет SVG на базовую безопасность и корректный XML-контейнер.

### Classes

- `EmailRegisterForm` : `forms.Form`
  - Methods: 2
  - `clean_email(self)`
  - `clean(self)`
- `UserUpdateForm` : `forms.ModelForm`
  - Methods: 2
  - `clean_username(self)`
  - `clean_email(self)`
- `ProfileIdentityUpdateForm` : `forms.Form`
  - Methods: 4
  - `__init__(self, *args, user=None, **kwargs)`
  - `clean_name(self)`
  - `clean_username(self)`
  - `save(self, profile: Profile) -> Profile`
- `ProfileUpdateForm` : `forms.ModelForm`
  - Methods: 4
  - `clean_bio(self)`
  - `clean(self)`
  - `clean_image(self)`
  - `save(self, commit=True)`

## `backend/users/middleware.py`

- Description: Содержит логику модуля `middleware` подсистемы `users`.
- Functions: 0
- Classes: 1

### Classes

- `UpdateLastSeenMiddleware`
  - Инкапсулирует логику класса `UpdateLastSeenMiddleware`.
  - Methods: 2
  - `__init__(self, get_response)`
    - Инициализирует экземпляр `UpdateLastSeenMiddleware`.
  - `__call__(self, request)`
    - Выполняет логику `__call__` с параметрами из сигнатуры.

## `backend/users/models.py`

- Description: Модели пользователей, идентичностей и профиля.
- Functions: 0
- Classes: 7

### Classes

- `Profile` : `models.Model`
  - Methods: 3
  - `__init__(self, *args, **kwargs)`
  - `__str__(self)`
  - `save(self, *args, **kwargs)`
    - Нормализует профиль и безопасно обрабатывает файл аватара.
- `UserIdentityCore` : `models.Model`
  - Methods: 2
  - `__str__(self)`
  - `save(self, *args, **kwargs)`
- `LoginIdentity` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `EmailIdentity` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `OAuthIdentity` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `PublicHandle` : `models.Model`
  - Methods: 1
  - `__str__(self)`
- `SecurityRateLimitBucket` : `models.Model`
  - Хранит состояние ограничений запросов для защитных сценариев.
  - Methods: 1
  - `__str__(self)`

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
- `profile(request)`
