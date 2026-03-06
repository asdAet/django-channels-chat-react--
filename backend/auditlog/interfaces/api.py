from __future__ import annotations

from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from auditlog.application import query_service, username_history_service
from auditlog.interfaces.permissions import IsStaffAuditReader
from auditlog.interfaces.serializers import AuditEventSerializer, UsernameHistorySerializer


@api_view(["GET"])
@permission_classes([IsStaffAuditReader])
def events_list_view(request):
    try:
        filters = query_service.parse_filters(request.query_params)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)

    items, next_cursor = query_service.list_events(filters)
    serializer = AuditEventSerializer(items, many=True)
    return Response({"items": serializer.data, "nextCursor": next_cursor})


@api_view(["GET"])
@permission_classes([IsStaffAuditReader])
def event_detail_view(_request, event_id: int):
    item = query_service.get_event(event_id)
    if not item:
        return Response({"error": "Not found"}, status=http_status.HTTP_404_NOT_FOUND)
    serializer = AuditEventSerializer(item)
    return Response({"item": serializer.data})


@api_view(["GET"])
@permission_classes([IsStaffAuditReader])
def actions_view(request):
    try:
        filters = query_service.parse_filters(request.query_params)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)

    items = query_service.list_action_counts(filters)
    return Response({"items": items})


@api_view(["GET"])
@permission_classes([IsStaffAuditReader])
def username_history_view(request, user_id: int):
    raw_limit = request.query_params.get("limit")
    try:
        limit = int(raw_limit) if raw_limit is not None else 200
    except (TypeError, ValueError):
        return Response({"error": "Invalid 'limit': must be an integer"}, status=http_status.HTTP_400_BAD_REQUEST)
    if limit < 1:
        return Response({"error": "Invalid 'limit': must be >= 1"}, status=http_status.HTTP_400_BAD_REQUEST)

    items = username_history_service.get_username_history(user_id=user_id, limit=limit)
    serializer = UsernameHistorySerializer(items, many=True)
    return Response({"items": serializer.data})
