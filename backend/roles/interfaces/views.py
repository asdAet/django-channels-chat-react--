"""DRF views for room-scoped roles, memberships and overrides."""

from __future__ import annotations

from typing import Any, cast

from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from roles.application import management_service
from roles.application.errors import RoleServiceError
from roles.interfaces.serializers import (
    MemberRolesOutputSerializer,
    MemberRolesUpdateInputSerializer,
    OverrideCreateInputSerializer,
    OverrideOutputSerializer,
    OverrideUpdateInputSerializer,
    RoleCreateInputSerializer,
    RoleOutputSerializer,
    RoleUpdateInputSerializer,
)


def _service_error_response(exc: RoleServiceError) -> Response:
    return Response(
        {"error": exc.message, "code": exc.code},
        status=exc.status_code,
    )


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    return int(value)


class RoomRolesApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_slug: str):
        try:
            items = management_service.list_room_roles(room_slug, request.user)
        except RoleServiceError as exc:
            return _service_error_response(exc)
        serializer = RoleOutputSerializer(items, many=True)
        return Response({"items": serializer.data})

    def post(self, request, room_slug: str):
        serializer = RoleCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(dict[str, Any], serializer.validated_data)
        try:
            role = management_service.create_room_role(
                room_slug=room_slug,
                actor=request.user,
                name=str(payload["name"]),
                color=str(payload.get("color", "#99AAB5")),
                position=int(payload.get("position", 0)),
                permissions=int(payload.get("permissions", 0)),
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        output = RoleOutputSerializer(role)
        return Response({"item": output.data}, status=http_status.HTTP_201_CREATED)


class RoomRoleDetailApiView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_slug: str, role_id: int):
        serializer = RoleUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(dict[str, Any], serializer.validated_data)
        try:
            role = management_service.update_room_role(
                room_slug=room_slug,
                role_id=int(role_id),
                actor=request.user,
                name=cast(str | None, payload.get("name")),
                color=cast(str | None, payload.get("color")),
                position=cast(int | None, payload.get("position")),
                permissions=cast(int | None, payload.get("permissions")),
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        output = RoleOutputSerializer(role)
        return Response({"item": output.data})

    def delete(self, request, room_slug: str, role_id: int):
        try:
            management_service.delete_room_role(
                room_slug=room_slug,
                role_id=int(role_id),
                actor=request.user,
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class RoomMemberRolesApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_slug: str, user_id: int):
        try:
            membership = management_service.get_member_roles(
                room_slug=room_slug,
                user_id=int(user_id),
                actor=request.user,
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        serializer = MemberRolesOutputSerializer(membership)
        return Response({"item": serializer.data})

    def patch(self, request, room_slug: str, user_id: int):
        serializer = MemberRolesUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(dict[str, Any], serializer.validated_data)
        raw_role_ids = payload.get("roleIds", [])
        role_ids = [int(item) for item in raw_role_ids] if isinstance(raw_role_ids, list) else []
        try:
            membership = management_service.set_member_roles(
                room_slug=room_slug,
                user_id=int(user_id),
                actor=request.user,
                role_ids=role_ids,
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        output = MemberRolesOutputSerializer(membership)
        return Response({"item": output.data})


class RoomOverridesApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_slug: str):
        try:
            items = management_service.list_room_overrides(room_slug, request.user)
        except RoleServiceError as exc:
            return _service_error_response(exc)
        serializer = OverrideOutputSerializer(items, many=True)
        return Response({"items": serializer.data})

    def post(self, request, room_slug: str):
        serializer = OverrideCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(dict[str, Any], serializer.validated_data)
        try:
            item = management_service.create_room_override(
                room_slug=room_slug,
                actor=request.user,
                target_role_id=_optional_int(payload.get("targetRoleId")),
                target_user_id=_optional_int(payload.get("targetUserId")),
                allow=int(payload.get("allow", 0)),
                deny=int(payload.get("deny", 0)),
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        output = OverrideOutputSerializer(item)
        return Response({"item": output.data}, status=http_status.HTTP_201_CREATED)


class RoomOverrideDetailApiView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_slug: str, override_id: int):
        serializer = OverrideUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(dict[str, Any], serializer.validated_data)
        try:
            item = management_service.update_room_override(
                room_slug=room_slug,
                override_id=int(override_id),
                actor=request.user,
                allow=_optional_int(payload.get("allow")),
                deny=_optional_int(payload.get("deny")),
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        output = OverrideOutputSerializer(item)
        return Response({"item": output.data})

    def delete(self, request, room_slug: str, override_id: int):
        try:
            management_service.delete_room_override(
                room_slug=room_slug,
                override_id=int(override_id),
                actor=request.user,
            )
        except RoleServiceError as exc:
            return _service_error_response(exc)
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class RoomMyPermissionsApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_slug: str):
        try:
            payload = management_service.permissions_for_me(room_slug, request.user)
        except RoleServiceError as exc:
            return _service_error_response(exc)
        return Response(payload)
