from rest_framework import serializers

from users.identity import user_public_username

from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """Класс RoomSerializer сериализует и валидирует данные API."""
    created_by = serializers.SerializerMethodField()

    def get_created_by(self, obj: Room):
        """Возвращает created by из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        creator = getattr(obj, "created_by", None)
        if creator is None:
            return None
        return user_public_username(creator)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = Room
        fields = ("id", "name", "slug", "kind", "created_by")
        read_only_fields = ("id", "slug", "created_by")


class RoomDetailSerializer(serializers.Serializer):
    """Класс RoomDetailSerializer сериализует и валидирует данные API."""
    roomId = serializers.IntegerField()
    name = serializers.CharField()
    kind = serializers.CharField()
    created = serializers.BooleanField(required=False)
    createdBy = serializers.CharField(allow_null=True, source="created_by_name")
    peer = serializers.DictField(allow_null=True, required=False)


class RoomPublicSerializer(serializers.Serializer):
    """Класс RoomPublicSerializer сериализует и валидирует данные API."""
    roomId = serializers.IntegerField()
    name = serializers.CharField()
    kind = serializers.CharField()
