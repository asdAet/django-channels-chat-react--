from rest_framework import serializers

from .models import Message, MessageAttachment
from users.identity import (
    user_display_name,
    user_profile_avatar_source,
    user_public_ref,
    user_public_username,
)


class AttachmentSerializer(serializers.ModelSerializer):
    """Класс AttachmentSerializer сериализует и валидирует данные API."""
    url = serializers.SerializerMethodField()
    thumbnailUrl = serializers.SerializerMethodField()
    originalFilename = serializers.CharField(source="original_filename")
    contentType = serializers.CharField(source="content_type")
    fileSize = serializers.IntegerField(source="file_size")

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = MessageAttachment
        fields = (
            "id", "originalFilename", "contentType", "fileSize",
            "url", "thumbnailUrl", "width", "height",
        )
        read_only_fields = fields

    def _build_url(self, field_file, obj):
        """Формирует url для дальнейшего использования в потоке обработки.
        
        Args:
            field_file: Объект файлового поля модели или формы.
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        if not field_file:
            return None

        attachment_build_fn = self.context.get("build_attachment_url")
        if attachment_build_fn:
            room_id = self.context.get("room_id")
            if room_id is None:
                message = getattr(obj, "message", None)
                room_id = getattr(message, "room_id", None)
            return attachment_build_fn(field_file, room_id)

        # Backward-compatible fallback.
        build_fn = self.context.get("build_profile_pic_url")
        if not build_fn:
            return None
        return build_fn(field_file)

    def get_url(self, obj):
        """Возвращает url из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return self._build_url(obj.file, obj)

    def get_thumbnailUrl(self, obj):
        """Возвращает thumbnail url из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return self._build_url(obj.thumbnail, obj)


class MessageSerializer(serializers.ModelSerializer):
    """Класс MessageSerializer сериализует и валидирует данные API."""
    publicRef = serializers.SerializerMethodField()
    content = serializers.CharField(source="message_content")
    createdAt = serializers.DateTimeField(source="date_added")
    profilePic = serializers.SerializerMethodField()
    avatarCrop = serializers.SerializerMethodField()
    displayName = serializers.SerializerMethodField()

    editedAt = serializers.DateTimeField(source="edited_at", allow_null=True, default=None)
    isDeleted = serializers.BooleanField(source="is_deleted", read_only=True)

    replyTo = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = Message
        fields = (
            "id", "publicRef", "username", "displayName", "content", "profilePic", "avatarCrop",
            "createdAt", "editedAt", "isDeleted",
            "replyTo", "attachments", "reactions",
        )
        read_only_fields = fields

    def get_profilePic(self, obj):
        """Возвращает profile pic из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        if obj.is_deleted:
            return None
        build_fn = self.context.get("build_profile_pic_url")
        if not build_fn:
            return None

        user = getattr(obj, "user", None)
        if user:
            avatar_source = user_profile_avatar_source(user)
            if avatar_source:
                return build_fn(avatar_source)

        return build_fn(obj.profile_pic) if obj.profile_pic else None

    def get_publicRef(self, obj):
        """Возвращает public ref из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        user = getattr(obj, "user", None)
        if user:
            return user_public_ref(user)
        return obj.username or ""

    def get_displayName(self, obj):
        """Возвращает display name из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        user = getattr(obj, "user", None)
        if user:
            return user_display_name(user)
        return obj.username or ""

    def get_avatarCrop(self, obj):
        """Возвращает avatar crop из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        if obj.is_deleted:
            return None
        serialize_fn = self.context.get("serialize_avatar_crop")
        if not serialize_fn:
            return None

        user = getattr(obj, "user", None)
        if user:
            profile = getattr(user, "profile", None)
            if profile:
                return serialize_fn(profile)
        return None

    def get_replyTo(self, obj):
        """Возвращает reply to из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        reply = obj.reply_to
        if not reply:
            return None
        if reply.is_deleted:
            return {
                "id": reply.id,
                "publicRef": None,
                "username": None,
                "displayName": None,
                "content": "[deleted]",
            }
        return {
            "id": reply.id,
            "publicRef": user_public_ref(reply.user) if reply.user else None,
            "username": user_public_username(reply.user) if reply.user else reply.username,
            "displayName": user_display_name(reply.user) if reply.user else (reply.username or ""),
            "content": reply.message_content[:150],
        }

    def get_reactions(self, obj):
        """Возвращает reactions из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        reactions_qs = obj.reactions.all()
        counts: dict[str, int] = {}
        user_reacted: set[str] = set()
        request = self.context.get("request")
        current_user_id = getattr(getattr(request, "user", None), "pk", None)

        for r in reactions_qs:
            counts[r.emoji] = counts.get(r.emoji, 0) + 1
            if current_user_id and r.user_id == current_user_id:
                user_reacted.add(r.emoji)

        return [
            {"emoji": emoji, "count": count, "me": emoji in user_reacted}
            for emoji, count in counts.items()
        ]

    def to_representation(self, instance):
        """Преобразует объект во внешнее представление для API.
        
        Args:
            instance: Экземпляр модели или доменного объекта.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        ret = super().to_representation(instance)
        user = getattr(instance, "user", None)
        if user:
            ret["publicRef"] = user_public_ref(user)
            ret["username"] = user_public_username(user)
            ret["displayName"] = user_display_name(user)
        else:
            ret["publicRef"] = ret.get("username") or ""
        if instance.is_deleted:
            ret["content"] = "[deleted]"
        return ret


class MessageCreateSerializer(serializers.Serializer):
    """Класс MessageCreateSerializer сериализует и валидирует данные API."""
    message = serializers.CharField(max_length=1000)


class MessagePaginationSerializer(serializers.Serializer):
    """Класс MessagePaginationSerializer сериализует и валидирует данные API."""
    messages = MessageSerializer(many=True)
    pagination = serializers.DictField()
