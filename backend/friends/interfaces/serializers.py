"""Serializers for friend management HTTP API."""

from __future__ import annotations

from django.conf import settings
from rest_framework import serializers

from chat_app_django.media_utils import serialize_avatar_crop
from friends.models import Friendship
from friends.utils import get_from_user_id, get_to_user_id
from users.avatar_service import resolve_user_avatar_source, resolve_user_avatar_url_from_request
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
    profile_image = resolve_user_avatar_url_from_request(request, user) if request is not None else None
    if profile_image is None and request is None:
        source = resolve_user_avatar_source(user)
        if source:
            normalized = source.strip()
            if normalized.startswith("http://") or normalized.startswith("https://"):
                profile_image = normalized
            else:
                media_url = str(getattr(settings, "MEDIA_URL", "/media/") or "/media/")
                profile_image = f"{media_url.rstrip('/')}/{normalized.lstrip('/')}"
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
