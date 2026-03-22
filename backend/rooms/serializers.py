from rest_framework import serializers

from users.identity import user_public_username

from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """Serialize basic room data for internal APIs."""

    created_by = serializers.SerializerMethodField()

    def get_created_by(self, obj: Room):
        creator = getattr(obj, "created_by", None)
        if creator is None:
            return None
        return user_public_username(creator)

    class Meta:
        model = Room
        fields = ("id", "name", "kind", "created_by")
        read_only_fields = ("id", "created_by")


class RoomDetailSerializer(serializers.Serializer):
    """Serialize room details returned to the client."""

    roomId = serializers.IntegerField()
    name = serializers.CharField()
    kind = serializers.CharField()
    created = serializers.BooleanField(required=False)
    createdBy = serializers.CharField(allow_null=True, source="created_by_name")
    peer = serializers.DictField(allow_null=True, required=False)


class RoomPublicSerializer(serializers.Serializer):
    """Serialize public room payloads."""

    roomId = serializers.IntegerField()
    name = serializers.CharField()
    kind = serializers.CharField()
