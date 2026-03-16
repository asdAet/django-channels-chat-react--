"""Serializers for friend management HTTP API."""

from __future__ import annotations

from rest_framework import serializers

from chat_app_django.media_utils import build_profile_url_from_request, serialize_avatar_crop
from friends.models import Friendship
from friends.utils import get_from_user_id, get_to_user_id
from users.identity import user_display_name, user_public_ref, user_public_username


def _require_from_user_id(obj: Friendship) -> int:
    uid = get_from_user_id(obj)
    if uid is None:
        raise ValueError("Не указан идентификатор отправителя дружбы")
    return uid


def _require_to_user_id(obj: Friendship) -> int:
    uid = get_to_user_id(obj)
    if uid is None:
        raise ValueError("Не указан идентификатор получателя дружбы")
    return uid


class _UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    publicRef = serializers.CharField()
    username = serializers.CharField()
    displayName = serializers.CharField()
    profileImage = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)


def _serialize_user_brief(user, request) -> dict:
    profile = getattr(user, "profile", None)
    profile_image = None
    if profile and getattr(profile, "image", None):
        image_name = getattr(profile.image, "name", "")
        if image_name:
            if request is not None:
                profile_image = build_profile_url_from_request(request, image_name)
            else:
                try:
                    profile_image = profile.image.url
                except (AttributeError, ValueError):
                    profile_image = None
    return {
        "id": user.pk,
        "publicRef": user_public_ref(user),
        "username": user_public_username(user),
        "displayName": user_display_name(user),
        "profileImage": profile_image,
        "avatarCrop": serialize_avatar_crop(profile),
    }


class FriendOutputSerializer(serializers.ModelSerializer):
    """Serializes an accepted friendship — shows the friend (to_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        request = self.context.get("request")
        return _serialize_user_brief(obj.to_user, request)


class IncomingRequestOutputSerializer(serializers.ModelSerializer):
    """Serializes incoming pending request — shows who sent it (from_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        request = self.context.get("request")
        return _serialize_user_brief(obj.from_user, request)


class OutgoingRequestOutputSerializer(serializers.ModelSerializer):
    """Serializes outgoing pending request — shows target (to_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        request = self.context.get("request")
        return _serialize_user_brief(obj.to_user, request)


class BlockedOutputSerializer(serializers.ModelSerializer):
    """Serializes a blocked user — shows who is blocked (to_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        request = self.context.get("request")
        return _serialize_user_brief(obj.to_user, request)


class PublicRefInputSerializer(serializers.Serializer):
    ref = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, attrs):
        ref = str(attrs.get("ref") or "").strip()
        username = str(attrs.get("username") or "").strip()
        value = ref or username
        if not value:
            raise serializers.ValidationError({"ref": ["Требуется публичный идентификатор"]})
        attrs["ref"] = value
        return attrs
