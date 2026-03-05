from rest_framework import serializers

from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(
        slug_field="username",
        read_only=True,
    )

    class Meta:
        model = Room
        fields = ("id", "name", "slug", "kind", "created_by")
        read_only_fields = ("id", "slug", "created_by")


class RoomDetailSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    kind = serializers.CharField()
    created = serializers.BooleanField(default=False)
    createdBy = serializers.CharField(allow_null=True, source="created_by_name")
    peer = serializers.DictField(allow_null=True, required=False)


class RoomPublicSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    kind = serializers.CharField()
