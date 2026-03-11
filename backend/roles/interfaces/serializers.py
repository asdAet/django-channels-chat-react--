"""Serializers for role-management HTTP API."""

from __future__ import annotations

from rest_framework import serializers

from roles.models import Membership, PermissionOverride, Role


class RoleOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = (
            "id",
            "name",
            "color",
            "position",
            "permissions",
            "is_default",
            "created_at",
        )


class RoleCreateInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$", required=False, default="#99AAB5")
    position = serializers.IntegerField(min_value=0, required=False, default=0)
    permissions = serializers.IntegerField(min_value=0, required=False, default=0)


class RoleUpdateInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$", required=False)
    position = serializers.IntegerField(min_value=0, required=False)
    permissions = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Требуется указать хотя бы одно поле")
        return attrs


class MemberRolesOutputSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source="user_id")
    username = serializers.CharField(source="user.username")
    roleIds = serializers.SerializerMethodField()
    roles = RoleOutputSerializer(many=True, read_only=True)

    class Meta:
        model = Membership
        fields = ("userId", "username", "roleIds", "roles", "is_banned", "joined_at")

    def get_roleIds(self, obj: Membership) -> list[int]:
        return list(obj.roles.order_by("-position", "id").values_list("id", flat=True))


class MemberRolesUpdateInputSerializer(serializers.Serializer):
    roleIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
    )


class OverrideOutputSerializer(serializers.ModelSerializer):
    targetRoleId = serializers.IntegerField(source="target_role_id", allow_null=True)
    targetUserId = serializers.IntegerField(source="target_user_id", allow_null=True)

    class Meta:
        model = PermissionOverride
        fields = ("id", "targetRoleId", "targetUserId", "allow", "deny")


class OverrideCreateInputSerializer(serializers.Serializer):
    targetRoleId = serializers.IntegerField(required=False, allow_null=True)
    targetUserId = serializers.IntegerField(required=False, allow_null=True)
    allow = serializers.IntegerField(min_value=0, required=False, default=0)
    deny = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate(self, attrs):
        target_role_id = attrs.get("targetRoleId")
        target_user_id = attrs.get("targetUserId")
        if (target_role_id is None) == (target_user_id is None):
            raise serializers.ValidationError("Требуется указать ровно одно из полей: targetRoleId или targetUserId")
        return attrs


class OverrideUpdateInputSerializer(serializers.Serializer):
    allow = serializers.IntegerField(min_value=0, required=False)
    deny = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Требуется указать хотя бы одно поле")
        return attrs
