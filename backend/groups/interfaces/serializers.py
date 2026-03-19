"""DRF serializers for the groups API."""

from rest_framework import serializers

from users.identity import user_public_username


# ── Group ──────────────────────────────────────────────────────────────

class GroupCreateInputSerializer(serializers.Serializer):
    """Класс GroupCreateInputSerializer сериализует и валидирует данные API."""
    name = serializers.CharField(max_length=50)
    description = serializers.CharField(max_length=2000, required=False, default="")
    isPublic = serializers.BooleanField(required=False)
    username = serializers.CharField(max_length=50, required=False, allow_null=True, default=None)


class GroupUpdateInputSerializer(serializers.Serializer):
    """Класс GroupUpdateInputSerializer сериализует и валидирует данные API."""
    name = serializers.CharField(max_length=50, required=False)
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    isPublic = serializers.BooleanField(required=False)
    username = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    slowModeSeconds = serializers.IntegerField(required=False, min_value=0, max_value=86400)
    joinApprovalRequired = serializers.BooleanField(required=False)
    avatarCropX = serializers.FloatField(required=False)
    avatarCropY = serializers.FloatField(required=False)
    avatarCropWidth = serializers.FloatField(required=False)
    avatarCropHeight = serializers.FloatField(required=False)
    avatarAction = serializers.ChoiceField(choices=["remove"], required=False)


class GroupOutputSerializer(serializers.Serializer):
    """Класс GroupOutputSerializer сериализует и валидирует данные API."""
    roomId = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    isPublic = serializers.BooleanField()
    username = serializers.CharField(allow_null=True)
    publicId = serializers.CharField()
    publicRef = serializers.CharField()
    memberCount = serializers.IntegerField()
    slowModeSeconds = serializers.IntegerField()
    joinApprovalRequired = serializers.BooleanField()
    createdBy = serializers.CharField(allow_null=True)
    avatarUrl = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)


class GroupListItemSerializer(serializers.Serializer):
    """Класс GroupListItemSerializer сериализует и валидирует данные API."""
    roomId = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    username = serializers.CharField(allow_null=True)
    publicId = serializers.CharField()
    publicRef = serializers.CharField()
    memberCount = serializers.IntegerField()
    avatarUrl = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)


# ── Invite ─────────────────────────────────────────────────────────────

class InviteCreateInputSerializer(serializers.Serializer):
    """Класс InviteCreateInputSerializer сериализует и валидирует данные API."""
    name = serializers.CharField(max_length=100, required=False, default="")
    expiresInSeconds = serializers.IntegerField(required=False, allow_null=True, default=None, min_value=60)
    maxUses = serializers.IntegerField(required=False, default=0, min_value=0)


class InviteOutputSerializer(serializers.Serializer):
    """Класс InviteOutputSerializer сериализует и валидирует данные API."""
    code = serializers.CharField()
    name = serializers.CharField()
    createdBy = serializers.SerializerMethodField()
    expiresAt = serializers.DateTimeField(source="expires_at", allow_null=True)
    maxUses = serializers.IntegerField(source="max_uses")
    useCount = serializers.IntegerField(source="use_count")
    isRevoked = serializers.BooleanField(source="is_revoked")
    isExpired = serializers.BooleanField(source="is_expired")
    createdAt = serializers.DateTimeField(source="created_at")

    def get_createdBy(self, obj):
        """Возвращает created by из текущего контекста или хранилища.
        
        Args:
            obj: Объект доменной модели или ORM-сущность.
        
        Returns:
            Функция не возвращает значение.
        """
        return user_public_username(obj.created_by) if obj.created_by else None


class InvitePreviewSerializer(serializers.Serializer):
    """Класс InvitePreviewSerializer сериализует и валидирует данные API."""
    code = serializers.CharField()
    groupId = serializers.IntegerField(required=False)
    groupPublicRef = serializers.CharField(required=False)
    groupName = serializers.CharField()
    groupDescription = serializers.CharField()
    memberCount = serializers.IntegerField()
    isPublic = serializers.BooleanField()


# ── Members ────────────────────────────────────────────────────────────

class MemberOutputSerializer(serializers.Serializer):
    """Класс MemberOutputSerializer сериализует и валидирует данные API."""
    userId = serializers.IntegerField()
    username = serializers.CharField()
    displayName = serializers.CharField(required=False)
    publicRef = serializers.CharField(required=False)
    nickname = serializers.CharField(allow_null=True)
    profileImage = serializers.CharField(allow_null=True, required=False)
    avatarCrop = serializers.DictField(allow_null=True, required=False)
    roles = serializers.ListField()
    joinedAt = serializers.CharField()
    isMuted = serializers.BooleanField()


class BannedMemberSerializer(serializers.Serializer):
    """Класс BannedMemberSerializer сериализует и валидирует данные API."""
    userId = serializers.IntegerField()
    username = serializers.CharField()
    displayName = serializers.CharField(required=False)
    publicRef = serializers.CharField(required=False)
    reason = serializers.CharField()
    bannedBy = serializers.CharField(allow_null=True)


class BanInputSerializer(serializers.Serializer):
    """Класс BanInputSerializer сериализует и валидирует данные API."""
    reason = serializers.CharField(max_length=500, required=False, default="")


class MuteInputSerializer(serializers.Serializer):
    """Класс MuteInputSerializer сериализует и валидирует данные API."""
    durationSeconds = serializers.IntegerField(min_value=1, max_value=366 * 86400)


# ── Join Requests ──────────────────────────────────────────────────────

class JoinRequestOutputSerializer(serializers.Serializer):
    """Класс JoinRequestOutputSerializer сериализует и валидирует данные API."""
    id = serializers.IntegerField()
    userId = serializers.IntegerField()
    username = serializers.CharField()
    message = serializers.CharField()
    createdAt = serializers.CharField()


# ── Pins ───────────────────────────────────────────────────────────────

class PinInputSerializer(serializers.Serializer):
    """Класс PinInputSerializer сериализует и валидирует данные API."""
    messageId = serializers.IntegerField()


class PinOutputSerializer(serializers.Serializer):
    """Класс PinOutputSerializer сериализует и валидирует данные API."""
    messageId = serializers.IntegerField()
    content = serializers.CharField()
    author = serializers.CharField()
    pinnedBy = serializers.CharField(allow_null=True)
    pinnedAt = serializers.CharField()
    createdAt = serializers.CharField()


# ── Ownership ──────────────────────────────────────────────────────────

class TransferOwnershipInputSerializer(serializers.Serializer):
    """Класс TransferOwnershipInputSerializer сериализует и валидирует данные API."""
    userId = serializers.IntegerField()
