from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    content = serializers.CharField(source="message_content")
    createdAt = serializers.DateTimeField(source="date_added", format="iso-8601")
    profilePic = serializers.SerializerMethodField()
    avatarCrop = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "username", "content", "profilePic", "avatarCrop", "createdAt")
        read_only_fields = fields

    def get_profilePic(self, obj):
        build_fn = self.context.get("build_profile_pic_url")
        if not build_fn:
            return None

        user = getattr(obj, "user", None)
        if user:
            profile = getattr(user, "profile", None)
            image = getattr(profile, "image", None) if profile else None
            if image:
                return build_fn(image)

        return build_fn(obj.profile_pic) if obj.profile_pic else None

    def get_avatarCrop(self, obj):
        serialize_fn = self.context.get("serialize_avatar_crop")
        if not serialize_fn:
            return None

        user = getattr(obj, "user", None)
        if user:
            profile = getattr(user, "profile", None)
            if profile:
                return serialize_fn(profile)
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        user = getattr(instance, "user", None)
        if user:
            ret["username"] = user.username
        return ret


class MessageCreateSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)


class MessagePaginationSerializer(serializers.Serializer):
    messages = MessageSerializer(many=True)
    pagination = serializers.DictField()
