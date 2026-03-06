from rest_framework import serializers

from auditlog.models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
    statusCode = serializers.IntegerField(source="status_code", allow_null=True)
    requestId = serializers.CharField(source="request_id", allow_null=True)
    actor = serializers.SerializerMethodField()

    class Meta:
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
        return {
            "userId": obj.actor_user_id_snapshot,
            "usernameSnapshot": obj.actor_username_snapshot,
            "isAuthenticated": obj.is_authenticated,
        }


class UsernameHistorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    createdAt = serializers.DateTimeField()
    oldUsername = serializers.CharField(allow_null=True)
    newUsername = serializers.CharField(allow_null=True)
    requestId = serializers.CharField(allow_null=True)
