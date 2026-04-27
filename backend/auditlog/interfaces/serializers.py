from rest_framework import serializers

from auditlog.models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    """Класс AuditEventSerializer сериализует и валидирует данные API."""
    createdAt = serializers.DateTimeField(source="created_at")
    statusCode = serializers.IntegerField(source="status_code", allow_null=True)
    requestId = serializers.CharField(source="request_id", allow_null=True)
    actor = serializers.SerializerMethodField()

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = AuditEvent
        fields = (
            "id",
            "createdAt",
            "action",
            "protocol",
            "method",
            "path",
            "statusCode",
            "success",
            "ip",
            "requestId",
            "actor",
            "metadata",
        )

    def get_actor(self, obj):
        """Возвращает actor из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return {
            "userId": obj.actor_user_id_snapshot,
            "usernameSnapshot": obj.actor_username_snapshot,
            "isAuthenticated": obj.is_authenticated,
        }


class UsernameHistorySerializer(serializers.Serializer):
    """Класс UsernameHistorySerializer сериализует и валидирует данные API."""
    id = serializers.IntegerField()
    createdAt = serializers.DateTimeField()
    oldUsername = serializers.CharField(allow_null=True)
    newUsername = serializers.CharField(allow_null=True)
    requestId = serializers.CharField(allow_null=True)
