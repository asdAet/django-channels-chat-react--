"""Serializers for role-management HTTP API."""

from __future__ import annotations

from rest_framework import serializers

from roles.models import Membership, PermissionOverride, Role
from users.identity import user_public_username


class RoleOutputSerializer(serializers.ModelSerializer):
    """Класс RoleOutputSerializer сериализует и валидирует данные API."""
    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
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
    """Класс RoleCreateInputSerializer сериализует и валидирует данные API."""
    name = serializers.CharField(max_length=100)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$", required=False, default="#99AAB5")
    position = serializers.IntegerField(min_value=0, required=False, default=0)
    permissions = serializers.IntegerField(min_value=0, required=False, default=0)


class RoleUpdateInputSerializer(serializers.Serializer):
    """Класс RoleUpdateInputSerializer сериализует и валидирует данные API."""
    name = serializers.CharField(max_length=100, required=False)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$", required=False)
    position = serializers.IntegerField(min_value=0, required=False)
    permissions = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        """Проверяет входные данные и возвращает нормализованный результат.
        
        Args:
            attrs: Атрибуты после первичной валидации.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        if not attrs:
            raise serializers.ValidationError("Требуется указать хотя бы одно поле")
        return attrs


class MemberRolesOutputSerializer(serializers.ModelSerializer):
    """Класс MemberRolesOutputSerializer сериализует и валидирует данные API."""
    userId = serializers.IntegerField(source="user_id")
    username = serializers.SerializerMethodField()
    roleIds = serializers.SerializerMethodField()
    roles = RoleOutputSerializer(many=True, read_only=True)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = Membership
        fields = ("userId", "username", "roleIds", "roles", "is_banned", "joined_at")

    def get_roleIds(self, obj: Membership) -> list[int]:
        """Возвращает role ids из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Список типа list[int] с результатами операции.
        """
        return list(obj.roles.order_by("-position", "id").values_list("id", flat=True))

    def get_username(self, obj: Membership) -> str:
        """Возвращает username из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        return user_public_username(obj.user)


class MemberRolesUpdateInputSerializer(serializers.Serializer):
    """Класс MemberRolesUpdateInputSerializer сериализует и валидирует данные API."""
    roleIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
    )


class OverrideOutputSerializer(serializers.ModelSerializer):
    """Класс OverrideOutputSerializer сериализует и валидирует данные API."""
    targetRoleId = serializers.IntegerField(source="target_role_id", allow_null=True)
    targetUserId = serializers.IntegerField(source="target_user_id", allow_null=True)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = PermissionOverride
        fields = ("id", "targetRoleId", "targetUserId", "allow", "deny")


class OverrideCreateInputSerializer(serializers.Serializer):
    """Класс OverrideCreateInputSerializer сериализует и валидирует данные API."""
    targetRoleId = serializers.IntegerField(required=False, allow_null=True)
    targetUserId = serializers.IntegerField(required=False, allow_null=True)
    allow = serializers.IntegerField(min_value=0, required=False, default=0)
    deny = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate(self, attrs):
        """Проверяет входные данные и возвращает нормализованный результат.
        
        Args:
            attrs: Атрибуты после первичной валидации.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        target_role_id = attrs.get("targetRoleId")
        target_user_id = attrs.get("targetUserId")
        if (target_role_id is None) == (target_user_id is None):
            raise serializers.ValidationError("Требуется указать ровно одно из полей: targetRoleId или targetUserId")
        return attrs


class OverrideUpdateInputSerializer(serializers.Serializer):
    """Класс OverrideUpdateInputSerializer сериализует и валидирует данные API."""
    allow = serializers.IntegerField(min_value=0, required=False)
    deny = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        """Проверяет входные данные и возвращает нормализованный результат.
        
        Args:
            attrs: Атрибуты после первичной валидации.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        if not attrs:
            raise serializers.ValidationError("Требуется указать хотя бы одно поле")
        return attrs
