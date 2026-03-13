from rest_framework import serializers


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    profileImage = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)
    bio = serializers.CharField(allow_blank=True)
    lastSeen = serializers.CharField(allow_null=True)
    registeredAt = serializers.CharField(allow_null=True)


class PeerSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    profileImage = serializers.CharField(allow_null=True)
    avatarCrop = serializers.DictField(allow_null=True)
    lastSeen = serializers.CharField(allow_null=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password1 = serializers.CharField()
    password2 = serializers.CharField()


class OAuthGoogleSerializer(serializers.Serializer):
    idToken = serializers.CharField(required=False, allow_blank=True)
    accessToken = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        id_token = str(attrs.get("idToken") or "").strip()
        access_token = str(attrs.get("accessToken") or "").strip()
        if not id_token and not access_token:
            raise serializers.ValidationError(
                {"accessToken": ["Укажите accessToken или idToken"]}
            )
        attrs["idToken"] = id_token
        attrs["accessToken"] = access_token
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Empty serializer used to render a POST form for logout in Browsable API."""


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    avatarCropX = serializers.FloatField(required=False)
    avatarCropY = serializers.FloatField(required=False)
    avatarCropWidth = serializers.FloatField(required=False)
    avatarCropHeight = serializers.FloatField(required=False)
