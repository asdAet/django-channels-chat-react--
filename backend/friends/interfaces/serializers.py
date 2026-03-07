"""Serializers for friend management HTTP API."""

from __future__ import annotations

from rest_framework import serializers

from friends.models import Friendship
from friends.utils import get_from_user_id, get_to_user_id


def _require_from_user_id(obj: Friendship) -> int:
    uid = get_from_user_id(obj)
    if uid is None:
        raise ValueError("Friendship sender id is missing")
    return uid


def _require_to_user_id(obj: Friendship) -> int:
    uid = get_to_user_id(obj)
    if uid is None:
        raise ValueError("Friendship recipient id is missing")
    return uid


class _UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


class FriendOutputSerializer(serializers.ModelSerializer):
    """Serializes an accepted friendship — shows the friend (to_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        return {"id": _require_to_user_id(obj), "username": obj.to_user.username}


class IncomingRequestOutputSerializer(serializers.ModelSerializer):
    """Serializes incoming pending request — shows who sent it (from_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        return {"id": _require_from_user_id(obj), "username": obj.from_user.username}


class OutgoingRequestOutputSerializer(serializers.ModelSerializer):
    """Serializes outgoing pending request — shows target (to_user)."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ("id", "user", "created_at")

    def get_user(self, obj: Friendship) -> dict:
        return {"id": _require_to_user_id(obj), "username": obj.to_user.username}


class UsernameInputSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
