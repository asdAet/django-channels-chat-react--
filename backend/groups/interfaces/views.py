"""REST API views for the groups subsystem."""

from functools import wraps
from typing import Any, cast

from rest_framework import status as http_status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from groups.application import (
    group_service,
    invite_service,
    member_service,
    ownership_service,
    pin_service,
)
from groups.application.group_service import (
    GroupConflictError,
    GroupError,
    GroupForbiddenError,
    GroupNotFoundError,
)

from .serializers import (
    BanInputSerializer,
    GroupCreateInputSerializer,
    GroupListItemSerializer,
    GroupOutputSerializer,
    GroupUpdateInputSerializer,
    InviteCreateInputSerializer,
    InviteOutputSerializer,
    InvitePreviewSerializer,
    JoinRequestOutputSerializer,
    MuteInputSerializer,
    PinInputSerializer,
    PinOutputSerializer,
    TransferOwnershipInputSerializer,
)


def _error(msg: str, code: int = 400) -> Response:
    """Вспомогательная функция `_error` реализует внутренний шаг бизнес-логики.
    
    Args:
        msg: Параметр msg, используемый в логике функции.
        code: Параметр code, используемый в логике функции.
    
    Returns:
        HTTP-ответ с результатом обработки.
    """
    return Response({"error": msg}, status=code)


def _validated_data(serializer: Any) -> dict[str, Any]:
    """Выполняет вспомогательную обработку для validated data.
    
    Args:
        serializer: Сериализатор с входными или валидированными данными.
    
    Returns:
        Словарь типа dict[str, Any] с результатами операции.
    """
    return cast(dict[str, Any], serializer.validated_data)


def _parse_positive_int(raw_value: str | None, param_name: str) -> int:
    """Разбирает positive int из входных данных с валидацией формата.
    
    Args:
        raw_value: Исходное значение параметра до преобразования и валидации.
        param_name: Имя входного параметра, участвующего в проверке.
    
    Returns:
        Целочисленное значение результата вычисления.
    """
    if raw_value is None:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")
    candidate = raw_value.strip()
    if not candidate:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")
    try:
        parsed = int(candidate)
    except (TypeError, ValueError):
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")
    if parsed < 1:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть >= 1")
    return parsed


def _handle_group_errors(func):
    """Обрабатывает событие group errors и выполняет связанную бизнес-логику.
    
    Args:
        func: Функция, которую оборачивает текущий декоратор.
    
    Returns:
        Функция не возвращает значение.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
        
        Args:
            *args: Дополнительные позиционные аргументы вызова.
            **kwargs: Дополнительные именованные аргументы вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            return func(*args, **kwargs)
        except GroupNotFoundError as exc:
            return _error(str(exc), http_status.HTTP_404_NOT_FOUND)
        except GroupForbiddenError as exc:
            return _error(str(exc), http_status.HTTP_403_FORBIDDEN)
        except GroupConflictError as exc:
            return _error(str(exc), http_status.HTTP_409_CONFLICT)
        except (GroupError, ValueError) as exc:
            return _error(str(exc), http_status.HTTP_400_BAD_REQUEST)
    return wrapper


# ── Group CRUD ─────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def create_group(request):
    """Создает group и возвращает созданную сущность.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Функция не возвращает значение.
    """
    ser = GroupCreateInputSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = _validated_data(ser)
    room = group_service.create_group(
        request.user,
        name=data["name"],
        description=data.get("description", ""),
        is_public=bool(data.get("isPublic", False)),
        username=data.get("username"),
    )
    info = group_service.get_group_info(room.pk, request.user, request=request)
    return Response(GroupOutputSerializer(info).data, status=http_status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
@_handle_group_errors
def list_public_groups(request):
    """Возвращает список public groups, доступных в текущем контексте.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Функция не возвращает значение.
    """
    search = request.query_params.get("search")
    limit_raw = request.query_params.get("limit")
    before_raw = request.query_params.get("before")
    limit = 20 if limit_raw is None else min(_parse_positive_int(limit_raw, "limit"), 100)
    before_id = _parse_positive_int(before_raw, "before") if before_raw is not None else None
    result = group_service.list_public_groups(
        search=search,
        before_id=before_id,
        limit=limit,
        request=request,
    )
    result["items"] = GroupListItemSerializer(result["items"], many=True).data
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def list_my_groups(request):
    """Возвращает список my groups, доступных в текущем контексте.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Функция не возвращает значение.
    """
    search = request.query_params.get("search")
    limit_raw = request.query_params.get("limit")
    before_raw = request.query_params.get("before")
    limit = 20 if limit_raw is None else min(_parse_positive_int(limit_raw, "limit"), 100)
    before_id = _parse_positive_int(before_raw, "before") if before_raw is not None else None
    result = group_service.list_my_groups(
        request.user,
        search=search,
        before_id=before_id,
        limit=limit,
        request=request,
    )
    result["items"] = GroupListItemSerializer(result["items"], many=True).data
    return Response(result)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, FormParser, MultiPartParser])
@_handle_group_errors
def group_detail(request, room_id):
    """Вспомогательная функция `group_detail` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        room_id: Идентификатор комнаты.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    if request.method == "GET":
        user = getattr(request, "user", None)
        actor = user if user and getattr(user, "is_authenticated", False) else None
        info = group_service.get_group_info(room_id, actor, request=request)
        return Response(GroupOutputSerializer(info).data)

    if request.method == "PATCH":
        if not getattr(request.user, "is_authenticated", False):
            return _error("Требуется аутентификация", 401)
        ser = GroupUpdateInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = _validated_data(ser)
        kwargs = {}
        if "name" in d:
            kwargs["name"] = d["name"]
        if "description" in d:
            kwargs["description"] = d["description"]
        if "isPublic" in d:
            kwargs["is_public"] = d["isPublic"]
        if "username" in d:
            kwargs["username"] = d["username"]
        if "slowModeSeconds" in d:
            kwargs["slow_mode_seconds"] = d["slowModeSeconds"]
        if "joinApprovalRequired" in d:
            kwargs["join_approval_required"] = d["joinApprovalRequired"]
        if "avatarAction" in d:
            kwargs["avatar_action"] = d["avatarAction"]
        if (
            "avatarCropX" in d
            or "avatarCropY" in d
            or "avatarCropWidth" in d
            or "avatarCropHeight" in d
        ):
            kwargs["avatar_crop"] = {
                "avatar_crop_x": d.get("avatarCropX"),
                "avatar_crop_y": d.get("avatarCropY"),
                "avatar_crop_width": d.get("avatarCropWidth"),
                "avatar_crop_height": d.get("avatarCropHeight"),
            }
        avatar_file = request.FILES.get("avatar")
        if avatar_file is not None:
            kwargs["avatar"] = avatar_file
        room = group_service.update_group(request.user, room_id, **kwargs)
        info = group_service.get_group_info(room.pk, request.user, request=request)
        return Response(GroupOutputSerializer(info).data)

    # DELETE
    if not getattr(request.user, "is_authenticated", False):
        return _error("Требуется аутентификация", 401)
    group_service.delete_group(request.user, room_id)
    return Response(status=http_status.HTTP_204_NO_CONTENT)


# ── Members ────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def join_group(request, room_id):
    """Добавляет участника или объект в group.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.join_group(request.user, room_id)
    return Response({"roomId": int(room_id), "status": "joined"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def leave_group(request, room_id):
    """Удаляет участника или объект из group.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.leave_group(request.user, room_id)
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def list_members(request, room_id):
    """Возвращает список members, доступных в текущем контексте.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    limit_raw = request.query_params.get("limit")
    before_raw = request.query_params.get("before")
    limit = 50 if limit_raw is None else min(_parse_positive_int(limit_raw, "limit"), 200)
    before_id = _parse_positive_int(before_raw, "before") if before_raw is not None else None
    result = member_service.list_members(
        request.user,
        room_id,
        before_id=before_id,
        limit=limit,
        request=request,
    )
    return Response(result)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def kick_member(request, room_id, user_id):
    """Исключает member с учетом проверок полномочий.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.kick_member(request.user, room_id, int(user_id))
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def ban_member(request, room_id, user_id):
    """Блокирует member в рамках текущего контекста.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    ser = BanInputSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = _validated_data(ser)
    member_service.ban_member(
        request.user, room_id, int(user_id), reason=data.get("reason", "")
    )
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def unban_member(request, room_id, user_id):
    """Снимает блокировку с member.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.unban_member(request.user, room_id, int(user_id))
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def mute_member(request, room_id, user_id):
    """Отключает активность member на заданный период.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    ser = MuteInputSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = _validated_data(ser)
    member_service.mute_member(
        request.user, room_id, int(user_id),
        duration_seconds=data["durationSeconds"],
    )
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def unmute_member(request, room_id, user_id):
    """Возвращает активность member после снятия ограничения.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.unmute_member(request.user, room_id, int(user_id))
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def list_banned(request, room_id):
    """Возвращает список banned, доступных в текущем контексте.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    limit_raw = request.query_params.get("limit")
    before_raw = request.query_params.get("before")
    limit = 50 if limit_raw is None else min(_parse_positive_int(limit_raw, "limit"), 200)
    before_id = _parse_positive_int(before_raw, "before") if before_raw is not None else None
    data = member_service.list_banned(
        request.user,
        room_id,
        before_id=before_id,
        limit=limit,
    )
    return Response(data)


# ── Invite Links ───────────────────────────────────────────────────────

@api_view(["POST", "GET"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def group_invites(request, room_id):
    """Вспомогательная функция `group_invites` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        room_id: Идентификатор комнаты.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    if request.method == "POST":
        ser = InviteCreateInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = _validated_data(ser)
        invite = invite_service.create_invite(
            request.user,
            room_id,
            name=data.get("name", ""),
            expires_in_seconds=data.get("expiresInSeconds"),
            max_uses=data.get("maxUses", 0),
        )
        return Response(InviteOutputSerializer(invite).data, status=http_status.HTTP_201_CREATED)

    # GET
    invites = invite_service.list_invites(request.user, room_id)
    return Response({"items": InviteOutputSerializer(invites, many=True).data})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def revoke_invite(request, room_id, code):
    """Отзывает invite и аннулирует дальнейшее использование.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        code: Код операции, приглашения или ошибки.
    
    Returns:
        Функция не возвращает значение.
    """
    invite_service.revoke_invite(request.user, room_id, code)
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
@_handle_group_errors
def invite_preview(request, code):
    """Вспомогательная функция `invite_preview` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        code: Параметр code, используемый в логике функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    info = invite_service.get_invite_info(code)
    return Response(InvitePreviewSerializer(info).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def join_via_invite(request, code):
    """Добавляет участника или объект в via invite.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        code: Код операции, приглашения или ошибки.
    
    Returns:
        Функция не возвращает значение.
    """
    result = invite_service.join_via_invite(request.user, code)
    return Response(result)


# ── Join Requests ──────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def list_join_requests(request, room_id):
    """Возвращает список join requests, доступных в текущем контексте.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    items = member_service.list_join_requests(request.user, room_id)
    return Response({"items": JoinRequestOutputSerializer(items, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def approve_join_request(request, room_id, request_id):
    """Подтверждает join request и применяет изменения.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        request_id: Идентификатор request, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.approve_join_request(request.user, room_id, int(request_id))
    return Response({"status": "approved"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def reject_join_request(request, room_id, request_id):
    """Отклоняет join request без применения изменений.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        request_id: Идентификатор request, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    member_service.reject_join_request(request.user, room_id, int(request_id))
    return Response({"status": "rejected"})


# ── Pinned Messages ───────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
@_handle_group_errors
def group_pins(request, room_id):
    """Вспомогательная функция `group_pins` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        room_id: Идентификатор комнаты.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    if request.method == "POST":
        if not getattr(request.user, "is_authenticated", False):
            return _error("Требуется аутентификация", 401)
        ser = PinInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = _validated_data(ser)
        pin = pin_service.pin_message(
            request.user, room_id, data["messageId"]
        )
        return Response(
            {"messageId": pin.message_id, "pinnedAt": pin.pinned_at.isoformat()},
            status=http_status.HTTP_201_CREATED,
        )

    # GET
    user = getattr(request, "user", None)
    actor = user if user and getattr(user, "is_authenticated", False) else None
    items = pin_service.list_pinned(room_id, actor)
    return Response({"items": PinOutputSerializer(items, many=True).data})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def unpin_message(request, room_id, message_id):
    """Снимает закрепление с message.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        room_id: Идентификатор room, используемый для выборки данных.
        message_id: Идентификатор message, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    pin_service.unpin_message(request.user, room_id, int(message_id))
    return Response(status=http_status.HTTP_204_NO_CONTENT)


# ── Ownership ──────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@_handle_group_errors
def transfer_ownership(request, room_id):
    """Передает владение.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        room_id: Идентификатор комнаты.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    ser = TransferOwnershipInputSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = _validated_data(ser)
    ownership_service.transfer_ownership(
        request.user, room_id, data["userId"]
    )
    return Response({"status": "transferred"})


class _HandledGroupAPIView(GenericAPIView):
    """Класс _HandledGroupAPIView реализует HTTP-обработчики для API-слоя."""
    def _execute(self, handler):
        """Обрабатывает шаг execute в HTTP API.
        
        Args:
            handler: Параметр handler, используемый в логике функции.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        try:
            return handler()
        except GroupNotFoundError as exc:
            return _error(str(exc), http_status.HTTP_404_NOT_FOUND)
        except GroupForbiddenError as exc:
            return _error(str(exc), http_status.HTTP_403_FORBIDDEN)
        except GroupConflictError as exc:
            return _error(str(exc), http_status.HTTP_409_CONFLICT)
        except (GroupError, ValueError) as exc:
            return _error(str(exc), http_status.HTTP_400_BAD_REQUEST)


class GroupCreateInteractiveView(_HandledGroupAPIView):
    """Класс GroupCreateInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = GroupCreateInputSerializer

    def post(self, request):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            room = group_service.create_group(
                request.user,
                name=data["name"],
                description=data.get("description", ""),
                is_public=bool(data.get("isPublic", False)),
                username=data.get("username"),
            )
            info = group_service.get_group_info(room.pk, request.user, request=request)
            return Response(
                GroupOutputSerializer(info).data,
                status=http_status.HTTP_201_CREATED,
            )

        return self._execute(_impl)


class GroupDetailInteractiveView(_HandledGroupAPIView):
    """Класс GroupDetailInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [AllowAny]
    serializer_class = GroupUpdateInputSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request, room_id):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            user = getattr(request, "user", None)
            actor = user if user and getattr(user, "is_authenticated", False) else None
            info = group_service.get_group_info(room_id, actor, request=request)
            return Response(GroupOutputSerializer(info).data)

        return self._execute(_impl)

    def patch(self, request, room_id):
        """Обрабатывает HTTP PATCH запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            if not getattr(request.user, "is_authenticated", False):
                return _error("Требуется аутентификация", 401)
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            kwargs = {}
            if "name" in data:
                kwargs["name"] = data["name"]
            if "description" in data:
                kwargs["description"] = data["description"]
            if "isPublic" in data:
                kwargs["is_public"] = data["isPublic"]
            if "username" in data:
                kwargs["username"] = data["username"]
            if "slowModeSeconds" in data:
                kwargs["slow_mode_seconds"] = data["slowModeSeconds"]
            if "joinApprovalRequired" in data:
                kwargs["join_approval_required"] = data["joinApprovalRequired"]
            if "avatarAction" in data:
                kwargs["avatar_action"] = data["avatarAction"]
            if (
                "avatarCropX" in data
                or "avatarCropY" in data
                or "avatarCropWidth" in data
                or "avatarCropHeight" in data
            ):
                kwargs["avatar_crop"] = {
                    "avatar_crop_x": data.get("avatarCropX"),
                    "avatar_crop_y": data.get("avatarCropY"),
                    "avatar_crop_width": data.get("avatarCropWidth"),
                    "avatar_crop_height": data.get("avatarCropHeight"),
                }
            avatar_file = request.FILES.get("avatar")
            if avatar_file is not None:
                kwargs["avatar"] = avatar_file

            room = group_service.update_group(request.user, room_id, **kwargs)
            info = group_service.get_group_info(room.pk, request.user, request=request)
            return Response(GroupOutputSerializer(info).data)

        return self._execute(_impl)

    def delete(self, request, room_id):
        """Обрабатывает HTTP DELETE запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            if not getattr(request.user, "is_authenticated", False):
                return _error("Требуется аутентификация", 401)
            group_service.delete_group(request.user, room_id)
            return Response(status=http_status.HTTP_204_NO_CONTENT)

        return self._execute(_impl)


class BanMemberInteractiveView(_HandledGroupAPIView):
    """Класс BanMemberInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = BanInputSerializer

    def post(self, request, room_id, user_id):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
            user_id: Идентификатор user, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            member_service.ban_member(
                request.user,
                room_id,
                int(user_id),
                reason=data.get("reason", ""),
            )
            return Response(status=http_status.HTTP_204_NO_CONTENT)

        return self._execute(_impl)


class MuteMemberInteractiveView(_HandledGroupAPIView):
    """Класс MuteMemberInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = MuteInputSerializer

    def post(self, request, room_id, user_id):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
            user_id: Идентификатор user, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            member_service.mute_member(
                request.user,
                room_id,
                int(user_id),
                duration_seconds=data["durationSeconds"],
            )
            return Response(status=http_status.HTTP_204_NO_CONTENT)

        return self._execute(_impl)


class GroupInvitesInteractiveView(_HandledGroupAPIView):
    """Класс GroupInvitesInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = InviteCreateInputSerializer

    def get(self, request, room_id):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            invites = invite_service.list_invites(request.user, room_id)
            return Response({"items": InviteOutputSerializer(invites, many=True).data})

        return self._execute(_impl)

    def post(self, request, room_id):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            invite = invite_service.create_invite(
                request.user,
                room_id,
                name=data.get("name", ""),
                expires_in_seconds=data.get("expiresInSeconds"),
                max_uses=data.get("maxUses", 0),
            )
            return Response(
                InviteOutputSerializer(invite).data,
                status=http_status.HTTP_201_CREATED,
            )

        return self._execute(_impl)


class GroupPinsInteractiveView(_HandledGroupAPIView):
    """Класс GroupPinsInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [AllowAny]
    serializer_class = PinInputSerializer

    def get(self, request, room_id):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            user = getattr(request, "user", None)
            actor = user if user and getattr(user, "is_authenticated", False) else None
            items = pin_service.list_pinned(room_id, actor)
            return Response({"items": PinOutputSerializer(items, many=True).data})

        return self._execute(_impl)

    def post(self, request, room_id):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            if not getattr(request.user, "is_authenticated", False):
                return _error("Требуется аутентификация", 401)
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            pin = pin_service.pin_message(request.user, room_id, data["messageId"])
            return Response(
                {
                    "messageId": pin.message_id,
                    "pinnedAt": pin.pinned_at.isoformat(),
                },
                status=http_status.HTTP_201_CREATED,
            )

        return self._execute(_impl)


class TransferOwnershipInteractiveView(_HandledGroupAPIView):
    """Класс TransferOwnershipInteractiveView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = TransferOwnershipInputSerializer

    def post(self, request, room_id):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        def _impl():
            """Выполняет внутреннюю часть операции в рамках декоратора или вспомогательной обертки.
            
            Returns:
                Функция не возвращает значение.
            """
            ser = self.get_serializer(data=request.data)
            ser.is_valid(raise_exception=True)
            data = _validated_data(ser)
            ownership_service.transfer_ownership(
                request.user,
                room_id,
                data["userId"],
            )
            return Response({"status": "transferred"})

        return self._execute(_impl)


