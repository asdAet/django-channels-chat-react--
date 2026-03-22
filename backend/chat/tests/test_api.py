# pyright: reportAttributeAccessIssue=false

import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.test import Client, RequestFactory, SimpleTestCase, TestCase

from chat import api
from messages.models import Message
from roles.models import Membership
from rooms.models import Room
from rooms.services import ensure_membership
from users.identity import (
    ensure_user_identity_core,
    room_public_ref,
    set_room_public_handle,
    set_user_public_handle,
    user_public_ref,
)

User = get_user_model()


class _BrokenProfileValue:
    @property
    def url(self):
        raise ValueError("broken")

    def __str__(self):
        return "profile_pics/fallback.jpg"


class ChatApiHelpersTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_build_profile_pic_url_returns_none_for_empty(self):
        request = self.factory.get("/api/chat/resolve/")
        self.assertIsNone(api._build_profile_pic_url(request, None))

    def test_build_profile_pic_url_falls_back_to_string_value(self):
        request = self.factory.get("/api/chat/resolve/")
        url = api._build_profile_pic_url(request, _BrokenProfileValue())
        self.assertIsNotNone(url)
        assert url is not None
        self.assertIn("/api/auth/media/profile_pics/fallback.jpg", url)

    def test_parse_positive_int_raises_for_invalid_value(self):
        with self.assertRaises(ValueError):
            api._parse_positive_int("bad", "limit")

    def test_public_room_returns_fallback_when_db_unavailable(self):
        with patch("chat.api.Room.objects.get_or_create", side_effect=OperationalError):
            room = api._public_room()
        self.assertEqual(room.kind, Room.Kind.PUBLIC)


class RoomDetailsApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(username="owner", password="pass12345")
        self.member = User.objects.create_user(username="member", password="pass12345")
        self.other = User.objects.create_user(username="other", password="pass12345")

    def _create_private_room(self):
        room = Room.objects.create(
            name="private room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name="Owner")
        return room

    def test_public_room_details_by_room_id(self):
        room = api._public_room()
        response = self.client.get(f"/api/chat/{room.pk}/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["roomId"], room.pk)
        self.assertEqual(payload["kind"], Room.Kind.PUBLIC)

    def test_group_room_details_returns_public_ref_and_avatar_fields(self):
        room = Room.objects.create(
            name="Avatar Group",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name="Owner")

        self.client.force_login(self.owner)
        response = self.client.get(f"/api/chat/{room.pk}/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["kind"], Room.Kind.GROUP)
        self.assertEqual(payload["roomId"], room.pk)
        self.assertIn("avatarUrl", payload)
        self.assertIn("avatarCrop", payload)
        self.assertTrue(str(payload["publicRef"]).startswith("-") or str(payload["publicRef"]).startswith("@"))

    def test_existing_private_room_denies_non_member(self):
        room = self._create_private_room()
        self.client.force_login(self.other)
        response = self.client.get(f"/api/chat/{room.pk}/")
        self.assertEqual(response.status_code, 404)

    def test_existing_private_room_allows_member(self):
        room = self._create_private_room()
        ensure_membership(room, self.member, role_name="Member")
        self.client.force_login(self.member)

        response = self.client.get(f"/api/chat/{room.pk}/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["created"])


class RoomMessagesApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(username="owner", password="pass12345")
        self.member = User.objects.create_user(username="member", password="pass12345")
        self.other = User.objects.create_user(username="other", password="pass12345")

    def _create_private_room(self):
        room = Room.objects.create(
            name="private room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name="Owner")
        return room

    def _create_direct_room(self):
        room = Room.objects.create(
            name="dm",
            kind=Room.Kind.DIRECT,
            direct_pair_key=f"{self.owner.pk}:{self.member.pk}",
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name="Owner")
        ensure_membership(room, self.member, role_name="Member")
        return room

    def _create_public_messages(self, total: int):
        room = api._public_room()
        for i in range(total):
            Message.objects.create(
                username="snapshot_name",
                user=self.owner,
                room=room,
                message_content=f"message-{i}",
                profile_pic="profile_pics/snapshot.jpg",
            )
        return room

    def test_room_messages_default_pagination(self):
        room = self._create_public_messages(60)
        response = self.client.get(f"/api/chat/{room.pk}/messages/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["messages"]), 50)
        self.assertTrue(payload["pagination"]["hasMore"])

    def test_private_room_messages_require_membership(self):
        room = self._create_private_room()
        Message.objects.create(username=self.owner.username, user=self.owner, room=room, message_content="hello")
        response = self.client.get(f"/api/chat/{room.pk}/messages/")
        self.assertEqual(response.status_code, 404)

    def test_private_room_messages_allow_member(self):
        room = self._create_private_room()
        ensure_membership(room, self.member, role_name="Member")
        Message.objects.create(username=self.owner.username, user=self.owner, room=room, message_content="hello")
        self.client.force_login(self.member)
        response = self.client.get(f"/api/chat/{room.pk}/messages/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["messages"]), 1)

    def test_direct_room_messages_deny_outsider(self):
        room = self._create_direct_room()
        Message.objects.create(username=self.owner.username, user=self.owner, room=room, message_content="hello")
        self.client.force_login(self.other)
        response = self.client.get(f"/api/chat/{room.pk}/messages/")
        self.assertEqual(response.status_code, 404)

    def test_room_messages_invalid_limit_returns_400(self):
        room = self._create_public_messages(1)
        response = self.client.get(f"/api/chat/{room.pk}/messages/?limit=bad")
        self.assertEqual(response.status_code, 400)


class ChatResolveApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(username="owner", password="pass12345")
        self.peer = User.objects.create_user(username="peer", password="pass12345")
        self.other = User.objects.create_user(username="other", password="pass12345")
        self.group = Room.objects.create(
            name="Crew Room",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.owner,
        )
        set_user_public_handle(self.peer, "peer")
        set_room_public_handle(self.group, "crew")
        ensure_user_identity_core(self.owner)
        ensure_user_identity_core(self.peer)
        ensure_user_identity_core(self.other)
        ensure_membership(self.group, self.owner, role_name="Owner")

    def _post_resolve(self, target: str):
        return self.client.post(
            "/api/chat/resolve/",
            data=json.dumps({"target": target}),
            content_type="application/json",
        )

    def test_direct_resolve_requires_auth(self):
        response = self._post_resolve("@peer")
        self.assertIn(response.status_code, (401, 403))

    def test_direct_resolve_rejects_self(self):
        self.client.force_login(self.owner)
        owner_ref = ensure_user_identity_core(self.owner).public_id
        response = self._post_resolve(str(owner_ref))
        self.assertEqual(response.status_code, 400)

    def test_direct_resolve_rejects_missing_user(self):
        self.client.force_login(self.owner)
        response = self._post_resolve("@missing")
        self.assertEqual(response.status_code, 404)

    def test_resolve_supports_public_room_without_auth(self):
        response = self._post_resolve("public")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["targetKind"], "public")
        self.assertEqual(payload["roomKind"], Room.Kind.PUBLIC)
        self.assertEqual(payload["resolvedTarget"], "public")

    def test_direct_resolve_supports_public_handle_with_at(self):
        self.client.force_login(self.owner)
        response = self._post_resolve("@peer")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("roomId", payload)
        self.assertEqual(payload["targetKind"], "direct")
        self.assertEqual(payload["peer"]["username"], "peer")
        self.assertEqual(payload["peer"]["publicRef"], user_public_ref(self.peer))

    def test_direct_resolve_supports_numeric_user_id(self):
        self.client.force_login(self.owner)
        peer_ref = ensure_user_identity_core(self.peer).public_id
        response = self._post_resolve(str(peer_ref))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["targetKind"], "direct")
        self.assertEqual(payload["peer"]["publicRef"], user_public_ref(self.peer))

    def test_group_resolve_rejects_removed_legacy_target(self):
        response = self._post_resolve("crew-room")
        self.assertEqual(response.status_code, 404)

    def test_group_resolve_supports_public_ref(self):
        response = self._post_resolve(room_public_ref(self.group))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["targetKind"], "group")
        self.assertEqual(payload["room"]["roomId"], self.group.pk)

    def test_repeated_direct_resolve_returns_same_room_id(self):
        self.client.force_login(self.owner)
        first = self._post_resolve("@peer")
        second = self._post_resolve("@peer")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json()["roomId"], second.json()["roomId"])

    def test_direct_chats_include_dialog_after_resolve(self):
        self.client.force_login(self.owner)
        start_response = self._post_resolve("@peer")
        self.assertEqual(start_response.status_code, 200)
        room_id = start_response.json()["roomId"]

        response = self.client.get("/api/chat/inbox/")
        self.assertEqual(response.status_code, 200)
        items = response.json()["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["roomId"], room_id)


class ChatApiExtraCoverageTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(username="owner_extra", password="pass12345")
        self.peer = User.objects.create_user(username="peer_extra", password="pass12345")
        set_user_public_handle(self.peer, "peer_extra")
        ensure_user_identity_core(self.owner)
        ensure_user_identity_core(self.peer)

    def _post_resolve(self, target: str):
        return self.client.post(
            "/api/chat/resolve/",
            data=json.dumps({"target": target}),
            content_type="application/json",
        )

    def test_chat_resolve_accepts_form_payload(self):
        self.client.force_login(self.owner)
        response = self.client.post("/api/chat/resolve/", data={"target": "@peer_extra"})
        self.assertEqual(response.status_code, 200)

    def test_chat_resolve_returns_503_when_room_creation_fails(self):
        self.client.force_login(self.owner)
        with patch("chat.api.ensure_direct_room_with_retry", side_effect=OperationalError):
            response = self._post_resolve("@peer_extra")
        self.assertEqual(response.status_code, 503)

    def test_chat_resolve_returns_503_when_role_assignment_fails(self):
        self.client.force_login(self.owner)
        room = Room.objects.create(
            name="stub",
            kind=Room.Kind.DIRECT,
            direct_pair_key=f"{self.owner.pk}:{self.peer.pk}",
            created_by=self.owner,
        )

        with patch("chat.api.ensure_direct_room_with_retry", return_value=(room, False)), patch(
            "chat.api._ensure_direct_memberships_with_retry",
            side_effect=OperationalError,
        ):
            response = self._post_resolve("@peer_extra")
        self.assertEqual(response.status_code, 503)

    def test_room_details_returns_fallback_payload_when_db_unavailable(self):
        with patch("chat.api._resolve_room", side_effect=OperationalError):
            response = self.client.get("/api/chat/999999/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["roomId"], 999999)
        self.assertFalse(payload["created"])

    def test_room_messages_returns_404_for_missing_room(self):
        response = self.client.get("/api/chat/999999/messages/")
        self.assertEqual(response.status_code, 404)
