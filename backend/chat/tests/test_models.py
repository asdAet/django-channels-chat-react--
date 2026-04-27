"""Tests for chat models."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from messages.models import Message
from roles.models import Role
from rooms.models import Room

User = get_user_model()


class ChatModelsTests(TestCase):
    """Model-level behavior and signal tests."""

    def test_message_str_uses_related_user_when_available(self):
        user = User.objects.create_user(username="msg_user", password="pass12345")
        room = Room.objects.create(name="Public", kind=Room.Kind.PUBLIC)
        message = Message.objects.create(
            username="sender_name",
            user=user,
            room=room,
            message_content="hello",
        )
        self.assertEqual(str(message), "msg_user: hello")

    def test_message_str_falls_back_to_username_field(self):
        room = Room.objects.create(name="Public", kind=Room.Kind.PUBLIC)
        message = Message.objects.create(
            username="sender_name",
            room=room,
            message_content="hello",
        )
        self.assertEqual(str(message), "sender_name: hello")

    def test_room_str_returns_name(self):
        room = Room.objects.create(name="My Room", kind=Room.Kind.PRIVATE)
        self.assertEqual(str(room), "My Room")

    def test_room_defaults_to_private_kind(self):
        room = Room.objects.create(name="Room")
        self.assertEqual(room.kind, Room.Kind.PRIVATE)

    def test_role_str(self):
        room = Room.objects.create(name="Role Room", kind=Room.Kind.PRIVATE)
        role = Role.objects.create(
            room=room,
            name="Member",
            position=20,
            permissions=0,
        )
        self.assertEqual(str(role), f"{room.pk}:Member")

    def test_role_signal_writes_security_audit_logs(self):
        room = Room.objects.create(name="Audit Room", kind=Room.Kind.PRIVATE)

        with self.assertLogs("security.audit", level="INFO") as captured:
            role = Role.objects.create(
                room=room,
                name="Member",
                position=20,
                permissions=0,
            )
            role.name = "Admin"
            role.save(update_fields=["name"])
            role.delete()

        joined = "\n".join(captured.output)
        self.assertIn("role.created", joined)
        self.assertIn("role.updated", joined)
        self.assertIn("role.deleted", joined)
