"""Tests for unified avatar service."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase, override_settings

from chat import utils
from rooms.models import Room
from users.avatar_service import (
    group_avatar_upload_dir,
    group_avatar_upload_to,
    group_default_avatar_path,
    profile_avatar_upload_to,
    resolve_group_avatar_source,
    resolve_group_avatar_url_from_request,
    resolve_user_avatar_source,
    resolve_user_avatar_url_from_request,
    resolve_user_avatar_url_from_scope,
    user_oauth_default_avatar_path,
    user_password_default_avatar_path,
    user_avatar_upload_dir,
)
from users.models import OAuthIdentity, Profile

User = get_user_model()


@override_settings(
    USER_PASSWORD_DEFAULT_AVATAR="avatars/Password_defualt.jpg",
    USER_OAUTH_DEFAULT_AVATAR="avatars/OAuth_defualt.jpg",
    GROUP_DEFAULT_AVATAR="avatars/Group_defualt.jpg",
    USER_AVATAR_UPLOAD_DIR="avatars/users",
    GROUP_AVATAR_UPLOAD_DIR="avatars/groups",
)
class AvatarServiceTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_password_user_uses_password_default_avatar_source(self):
        user = User.objects.create_user(username="pwd_avatar_user", password="pass12345")
        self.assertEqual(resolve_user_avatar_source(user), user_password_default_avatar_path())

    def test_oauth_user_uses_oauth_default_avatar_source_when_provider_avatar_missing(self):
        user = User.objects.create_user(username="oauth_avatar_user", password="pass12345")
        OAuthIdentity.objects.create(
            user=user,
            provider=OAuthIdentity.Provider.GOOGLE,
            provider_user_id="google_123",
        )
        self.assertEqual(resolve_user_avatar_source(user), user_oauth_default_avatar_path())

    def test_oauth_user_prefers_provider_avatar_url(self):
        user = User.objects.create_user(username="oauth_avatar_url_user", password="pass12345")
        OAuthIdentity.objects.create(
            user=user,
            provider=OAuthIdentity.Provider.GOOGLE,
            provider_user_id="google_456",
        )
        profile = Profile.objects.get(user=user)
        profile.avatar_url = "https://lh3.googleusercontent.com/avatar.png"
        profile.save(update_fields=["avatar_url"])
        user.refresh_from_db()

        self.assertEqual(resolve_user_avatar_source(user), "https://lh3.googleusercontent.com/avatar.png")

    def test_custom_user_image_has_priority(self):
        user = User.objects.create_user(username="custom_avatar_user", password="pass12345")
        Profile.objects.filter(user=user).update(image="profile_pics/custom_avatar.png")
        user.refresh_from_db()

        self.assertEqual(resolve_user_avatar_source(user), "profile_pics/custom_avatar.png")

    def test_group_uses_group_default_avatar_when_custom_missing(self):
        owner = User.objects.create_user(username="group_avatar_owner", password="pass12345")
        room = Room.objects.create(
            name="Avatar Group",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        self.assertEqual(resolve_group_avatar_source(room), group_default_avatar_path())

    def test_group_custom_avatar_has_priority(self):
        owner = User.objects.create_user(username="group_custom_owner", password="pass12345")
        room = Room.objects.create(
            name="Avatar Group 2",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        Room.objects.filter(pk=room.pk).update(avatar="avatars/groups/custom_group_avatar.png")
        room.refresh_from_db()

        self.assertEqual(resolve_group_avatar_source(room), "avatars/groups/custom_group_avatar.png")

    def test_request_avatar_url_for_default_password_avatar_is_signed(self):
        user = User.objects.create_user(username="signed_avatar_user", password="pass12345")
        url = resolve_user_avatar_url_from_request(self.factory.get("/api/auth/session/"), user)
        self.assertIsNotNone(url)
        assert url is not None

        parsed = urlparse(url)
        self.assertEqual(parsed.path, f"/api/auth/media/{user_password_default_avatar_path()}")
        query = parse_qs(parsed.query)
        self.assertIn("exp", query)
        self.assertIn("sig", query)
        self.assertTrue(
            utils.is_valid_media_signature(
                user_password_default_avatar_path(),
                int(query["exp"][0]),
                query["sig"][0],
            )
        )

    def test_scope_avatar_url_for_default_password_avatar_is_signed(self):
        user = User.objects.create_user(username="scope_avatar_user", password="pass12345")
        scope = {
            "headers": [(b"host", b"localhost:8000")],
            "scheme": "ws",
            "server": ("localhost", 8000),
        }
        url = resolve_user_avatar_url_from_scope(scope, user)
        self.assertIsNotNone(url)
        assert url is not None
        parsed = urlparse(url)
        self.assertEqual(parsed.path, f"/api/auth/media/{user_password_default_avatar_path()}")

    def test_group_default_avatar_url_is_signed(self):
        owner = User.objects.create_user(username="group_url_owner", password="pass12345")
        room = Room.objects.create(
            name="Group Avatar Url",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        url = resolve_group_avatar_url_from_request(self.factory.get("/api/groups/public/"), room)
        self.assertIsNotNone(url)
        assert url is not None
        parsed = urlparse(url)
        self.assertEqual(parsed.path, f"/api/auth/media/{group_default_avatar_path()}")

    def test_profile_avatar_upload_path_uses_users_folder_by_default(self):
        user = User.objects.create_user(username="upload_pwd_user", password="pass12345")
        profile = Profile.objects.get(user=user)
        path = profile_avatar_upload_to(profile, "avatar.png")
        self.assertTrue(path.startswith(f"{user_avatar_upload_dir()}/"))

    def test_profile_avatar_upload_path_uses_same_users_folder_for_oauth_users(self):
        user = User.objects.create_user(username="upload_oauth_user", password="pass12345")
        OAuthIdentity.objects.create(
            user=user,
            provider=OAuthIdentity.Provider.GOOGLE,
            provider_user_id="google_789",
        )
        profile = Profile.objects.get(user=user)
        path = profile_avatar_upload_to(profile, "avatar.png")
        self.assertTrue(path.startswith(f"{user_avatar_upload_dir()}/"))

    def test_group_avatar_upload_path_uses_group_folder(self):
        owner = User.objects.create_user(username="upload_group_owner", password="pass12345")
        room = Room.objects.create(
            name="Upload Group",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        path = group_avatar_upload_to(room, "avatar.png")
        self.assertTrue(path.startswith(f"{group_avatar_upload_dir()}/"))
