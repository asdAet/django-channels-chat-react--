"""Coverage tests for users serializers."""

from typing import Any, cast

from django.test import SimpleTestCase

from users.serializers import (
    LoginSerializer,
    OAuthGoogleSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class UsersSerializersTests(SimpleTestCase):
    def test_user_serializer_accepts_full_payload(self):
        serializer = UserSerializer(
            data={
                "id": 1,
                "name": "User",
                "handle": "user",
                "publicId": "1234567890",
                "publicRef": "@user",
                "isSuperuser": False,
                "email": "user@example.com",
                "profileImage": None,
                "avatarCrop": None,
                "bio": "",
                "lastSeen": None,
                "registeredAt": None,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_login_serializer_validates_identifier(self):
        serializer = LoginSerializer(data={"password": "x"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("identifier", serializer.errors)

    def test_register_serializer_requires_all_fields(self):
        serializer = RegisterSerializer(data={"email": "user@example.com"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("login", serializer.errors)
        self.assertIn("password", serializer.errors)
        self.assertIn("passwordConfirm", serializer.errors)
        self.assertIn("name", serializer.errors)

    def test_oauth_google_serializer_requires_token(self):
        serializer = OAuthGoogleSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("idToken", serializer.errors)

    def test_oauth_google_serializer_normalizes_values(self):
        serializer = OAuthGoogleSerializer(data={"idToken": "  id  ", "username": "  user  "})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        validated_data = cast(dict[str, Any], serializer.validated_data)
        self.assertEqual(validated_data.get("idToken"), "id")
        self.assertEqual(validated_data.get("accessToken"), "")
        self.assertEqual(validated_data.get("username"), "user")

    def test_oauth_google_serializer_accepts_access_token(self):
        serializer = OAuthGoogleSerializer(data={"accessToken": "  access  "})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        validated_data = cast(dict[str, Any], serializer.validated_data)
        self.assertEqual(validated_data.get("idToken"), "")
        self.assertEqual(validated_data.get("accessToken"), "access")

    def test_profile_update_serializer_accepts_crop_fields(self):
        serializer = ProfileUpdateSerializer(
            data={
                "name": "Test",
                "bio": "bio",
                "avatarCropX": 0.1,
                "avatarCropY": 0.2,
                "avatarCropWidth": 0.3,
                "avatarCropHeight": 0.4,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
