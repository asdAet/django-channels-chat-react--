from rest_framework import serializers


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(required=False, allow_blank=True)
    handle = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    publicId = serializers.CharField(required=False, allow_blank=True)
    publicRef = serializers.CharField(required=False, allow_blank=True)
    isSuperuser = serializers.BooleanField(required=False)
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
    identifier = serializers.CharField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()
    passwordConfirm = serializers.CharField()
    name = serializers.CharField()
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class OAuthGoogleSerializer(serializers.Serializer):
    idToken = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    accessToken = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    username = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)

    def validate(self, attrs):
        token = str(attrs.get("idToken") or "").strip()
        access_token = str(attrs.get("accessToken") or "").strip()
        if not token and not access_token:
            raise serializers.ValidationError({"idToken": "Требуется idToken или accessToken"})
        attrs["idToken"] = token
        attrs["accessToken"] = access_token
        username = attrs.get("username")
        if isinstance(username, str):
            attrs["username"] = username.strip()
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Empty serializer used to render a POST form for logout in Browsable API."""


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    image = serializers.FileField(required=False, allow_null=True)
    avatarCropX = serializers.FloatField(required=False)
    avatarCropY = serializers.FloatField(required=False)
    avatarCropWidth = serializers.FloatField(required=False)
    avatarCropHeight = serializers.FloatField(required=False)


class HandleUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)


class SecuritySettingsSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    newPassword = serializers.CharField(required=False, allow_blank=True)
    verifyEmail = serializers.BooleanField(required=False)
    unlinkOAuthProvider = serializers.CharField(required=False, allow_blank=True)
