from rest_framework import serializers

from .models import ChatRole


class ChatRoleSerializer(serializers.ModelSerializer):
    room_slug = serializers.SlugRelatedField(
        source="room",
        slug_field="slug",
        read_only=True,
    )
    username = serializers.SlugRelatedField(
        source="user",
        slug_field="username",
        read_only=True,
    )
    granted_by_username = serializers.SlugRelatedField(
        source="granted_by",
        slug_field="username",
        read_only=True,
    )

    class Meta:
        model = ChatRole
        fields = (
            "id",
            "room_slug",
            "username",
            "role",
            "username_snapshot",
            "granted_by_username",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
