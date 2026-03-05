from rest_framework import serializers


class UserSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    profileImage = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)
    bio = serializers.CharField(allow_blank=True)
    lastSeen = serializers.CharField(allow_null=True)
    registeredAt = serializers.CharField(allow_null=True)


class PeerSerializer(serializers.Serializer):
    username = serializers.CharField()
    profileImage = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)
    lastSeen = serializers.CharField(allow_null=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password1 = serializers.CharField()
    password2 = serializers.CharField()
