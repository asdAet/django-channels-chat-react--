"""Coverage tests for users.identity helpers."""

from __future__ import annotations

from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from rooms.models import Room
from users.avatar_service import user_password_default_avatar_path
from users import identity
from users.models import Profile, UserIdentityCore

User = get_user_model()


class UsersIdentityTests(TestCase):
    def test_normalizers_handle_non_string_and_prefix(self):
        self.assertEqual(identity.normalize_email(None), "")
        self.assertEqual(identity.normalize_email("  A@B.C "), "a@b.c")
        self.assertEqual(identity.normalize_public_handle(None), "")
        self.assertEqual(identity.normalize_public_handle("  @Alice  "), "alice")

    def test_validate_public_handle_enforces_rules(self):
        with self.assertRaises(ValueError):
            identity.validate_public_handle("")
        with self.assertRaises(ValueError):
            identity.validate_public_handle("ab")
        with self.assertRaises(ValueError):
            identity.validate_public_handle("bad name")
        self.assertEqual(identity.validate_public_handle("@Alice"), "alice")

    def test_generate_technical_username_retries_on_collision(self):
        User.objects.create_user(username="seed_aaaaaa", password="pass12345")
        with patch("users.identity.secrets.token_hex", side_effect=["aaaaaa", "bbbbbb"]):
            generated = identity.generate_technical_username("seed")
        self.assertEqual(generated, "seed_bbbbbb")

    def test_generate_technical_username_uses_last_resort_fallback(self):
        filter_result = Mock()
        filter_result.exists.side_effect = [True] * 16 + [False]
        token_values = ["aaaaaa"] * 16 + ["deadbeefdeadbeef"]
        with patch("users.identity.User.objects.filter", return_value=filter_result), patch(
            "users.identity.secrets.token_hex",
            side_effect=token_values,
        ):
            generated = identity.generate_technical_username("seed")
        self.assertEqual(generated, "u_deadbeefdeadbeef")

    def test_user_public_username_and_display_name_priority(self):
        user = User.objects.create_user(username="fallback_user", password="pass12345", first_name="First")
        profile = identity.ensure_profile(user)
        profile.name = "Display Name"
        profile.save(update_fields=["name"])

        identity.set_user_public_handle(user, "publicname")
        self.assertEqual(identity.user_public_username(user), "publicname")
        self.assertEqual(identity.user_display_name(user), "Display Name")

        identity.set_user_public_handle(user, None)
        user.refresh_from_db()
        profile.name = ""
        profile.save(update_fields=["name"])
        self.assertEqual(identity.user_public_username(user), identity.user_public_id(user))
        self.assertEqual(identity.user_display_name(user), "First")

    def test_user_profile_avatar_source_returns_default_avatar_for_non_oauth_user(self):
        user = User.objects.create_user(username="default_avatar_user", password="pass12345")
        profile = identity.ensure_profile(user)
        profile.avatar_url = ""
        profile.save(update_fields=["avatar_url"])
        self.assertEqual(identity.user_profile_avatar_source(user), user_password_default_avatar_path())

    def test_user_profile_avatar_source_prefers_oauth_avatar_when_image_is_default(self):
        user = User.objects.create_user(username="oauth_avatar_user", password="pass12345")
        profile = identity.ensure_profile(user)
        profile.avatar_url = "https://cdn.example.com/avatar.png"
        profile.save(update_fields=["avatar_url"])
        self.assertEqual(identity.user_profile_avatar_source(user), "https://cdn.example.com/avatar.png")

    def test_get_user_by_public_handle_and_public_id(self):
        by_handle = User.objects.create_user(username="handle_lookup_user", password="pass12345")
        identity.set_user_public_handle(by_handle, "profile_handle")

        by_public_id = User.objects.create_user(username="id_lookup_user", password="pass12345")
        public_id = identity.user_public_id(by_public_id)

        self.assertEqual(identity.get_user_by_public_handle("profile_handle"), by_handle)
        self.assertEqual(identity.get_user_by_public_id(public_id), by_public_id)
        self.assertIsNone(identity.get_user_by_public_handle(""))

    def test_ensure_profile_returns_existing_or_creates_new(self):
        user = User.objects.create_user(username="profile_user", password="pass12345")
        existing = identity.ensure_profile(user)
        existing_user = getattr(existing, "user", None)
        self.assertEqual(getattr(existing_user, "pk", None), user.pk)

        Profile.objects.filter(user=user).delete()
        user.refresh_from_db()
        recreated = identity.ensure_profile(user)
        recreated_user = getattr(recreated, "user", None)
        self.assertEqual(getattr(recreated_user, "pk", None), user.pk)

    def test_user_public_id_format_and_immutability(self):
        user = User.objects.create_user(username="public_id_user", password="pass12345")
        core = identity.ensure_user_identity_core(user)
        self.assertRegex(core.public_id, r"^[1-9]\d{9}$")

        core.public_id = "1234567891"
        with self.assertRaises(ValidationError):
            core.save(update_fields=["public_id"])

    def test_group_public_id_format_and_immutability(self):
        owner = User.objects.create_user(username="group_owner", password="pass12345")
        room = Room.objects.create(
            name="Group Room",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        public_id = identity.ensure_group_public_id(room)
        self.assertRegex(public_id, r"^-[1-9]\d{9}$")

        room.public_id = "-1234567891"
        with self.assertRaises(ValidationError):
            room.save(update_fields=["public_id"])

    def test_user_identity_core_created_automatically_on_user_create(self):
        user = User.objects.create_user(username="auto_identity_user", password="pass12345")
        core = UserIdentityCore.objects.filter(user=user).first()
        self.assertIsNotNone(core)
        assert core is not None
        self.assertRegex(core.public_id, r"^[1-9]\d{9}$")

    def test_group_public_id_created_automatically_on_group_create(self):
        owner = User.objects.create_user(username="auto_group_owner", password="pass12345")
        room = Room.objects.create(
            name="Auto Public Id Group",
            kind=Room.Kind.GROUP,
            created_by=owner,
        )
        room.refresh_from_db()
        self.assertRegex(str(room.public_id or ""), r"^-[1-9]\d{9}$")
