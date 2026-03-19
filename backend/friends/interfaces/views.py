"""DRF views for friend management."""

from __future__ import annotations

from rest_framework import status as http_status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from friends.application import friend_service
from friends.application.errors import FriendServiceError
from friends.interfaces.serializers import (
    BlockedOutputSerializer,
    FriendOutputSerializer,
    IncomingRequestOutputSerializer,
    OutgoingRequestOutputSerializer,
    PublicRefInputSerializer,
)


def _service_error_response(exc: FriendServiceError) -> Response:
    """Вспомогательная функция `_service_error_response` реализует внутренний шаг бизнес-логики.
    
    Args:
        exc: Параметр exc, используемый в логике функции.
    
    Returns:
        HTTP-ответ с результатом обработки.
    """
    return Response(
        {"error": exc.message, "code": exc.code},
        status=exc.status_code,
    )


class FriendListApiView(APIView):
    """Класс FriendListApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            items = friend_service.list_friends(request.user)
        except FriendServiceError as exc:
            return _service_error_response(exc)
        serializer = FriendOutputSerializer(items, many=True, context={"request": request})
        return Response({"items": serializer.data})


class IncomingRequestsApiView(APIView):
    """Класс IncomingRequestsApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            items = friend_service.list_incoming_requests(request.user)
        except FriendServiceError as exc:
            return _service_error_response(exc)
        serializer = IncomingRequestOutputSerializer(items, many=True, context={"request": request})
        return Response({"items": serializer.data})


class OutgoingRequestsApiView(APIView):
    """Класс OutgoingRequestsApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            items = friend_service.list_outgoing_requests(request.user)
        except FriendServiceError as exc:
            return _service_error_response(exc)
        serializer = OutgoingRequestOutputSerializer(items, many=True, context={"request": request})
        return Response({"items": serializer.data})


class SendRequestApiView(GenericAPIView):
    """Класс SendRequestApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = PublicRefInputSerializer

    def get(self, _request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            _request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        return Response({"detail": "Используйте POST с публичным идентификатором"})

    def post(self, request):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_ref = serializer.validated_data["ref"]
        try:
            friendship = friend_service.send_request(
                request.user,
                target_ref,
            )
        except FriendServiceError as exc:
            return _service_error_response(exc)
        output = OutgoingRequestOutputSerializer(friendship, context={"request": request})
        return Response({"item": output.data}, status=http_status.HTTP_201_CREATED)


class AcceptRequestApiView(APIView):
    """Класс AcceptRequestApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id: int):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            friendship_id: Идентификатор friendship, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            friendship = friend_service.accept_request(request.user, int(friendship_id))
        except FriendServiceError as exc:
            return _service_error_response(exc)
        output = IncomingRequestOutputSerializer(friendship, context={"request": request})
        return Response({"item": output.data})


class DeclineRequestApiView(APIView):
    """Класс DeclineRequestApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id: int):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            friendship_id: Идентификатор friendship, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            friendship = friend_service.decline_request(request.user, int(friendship_id))
        except FriendServiceError as exc:
            return _service_error_response(exc)
        output = IncomingRequestOutputSerializer(friendship, context={"request": request})
        return Response({"item": output.data})


class CancelOutgoingRequestApiView(APIView):
    """Класс CancelOutgoingRequestApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, friendship_id: int):
        """Обрабатывает HTTP DELETE запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            friendship_id: Идентификатор friendship, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            friendship = friend_service.cancel_outgoing_request(request.user, int(friendship_id))
        except FriendServiceError as exc:
            return _service_error_response(exc)
        output = OutgoingRequestOutputSerializer(friendship, context={"request": request})
        return Response({"item": output.data})


class RemoveFriendApiView(APIView):
    """Класс RemoveFriendApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id: int):
        """Обрабатывает HTTP DELETE запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            user_id: Идентификатор user, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            friend_service.remove_friend(request.user, int(user_id))
        except FriendServiceError as exc:
            return _service_error_response(exc)
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class BlockedListApiView(APIView):
    """Класс BlockedListApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            items = friend_service.list_blocked(request.user)
        except FriendServiceError as exc:
            return _service_error_response(exc)
        serializer = BlockedOutputSerializer(items, many=True, context={"request": request})
        return Response({"items": serializer.data})


class BlockUserApiView(GenericAPIView):
    """Класс BlockUserApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]
    serializer_class = PublicRefInputSerializer

    def get(self, _request):
        """Обрабатывает HTTP GET запрос в рамках текущего представления.
        
        Args:
            _request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        return Response({"detail": "Используйте POST с публичным идентификатором"})

    def post(self, request):
        """Обрабатывает HTTP POST запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Функция не возвращает значение.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_ref = serializer.validated_data["ref"]
        try:
            friendship = friend_service.block_user(
                request.user,
                target_ref,
            )
        except FriendServiceError as exc:
            return _service_error_response(exc)
        return Response(
            {"item": {"id": friendship.pk, "status": friendship.status}},
            status=http_status.HTTP_201_CREATED,
        )


class UnblockUserApiView(APIView):
    """Класс UnblockUserApiView реализует HTTP-обработчики для API-слоя."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id: int):
        """Обрабатывает HTTP DELETE запрос в рамках текущего представления.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            user_id: Идентификатор user, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            friend_service.unblock_user(request.user, int(user_id))
        except FriendServiceError as exc:
            return _service_error_response(exc)
        return Response(status=http_status.HTTP_204_NO_CONTENT)
