# pyright: reportAttributeAccessIssue=false

"""Содержит тесты модуля `test_access` подсистемы `chat`."""


from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.http import Http404
from django.test import TestCase

from roles.access import can_read, can_write, ensure_can_read_or_404, ensure_can_write, get_user_role
from rooms.services import ensure_membership
from rooms.models import Room

User = get_user_model()


class ChatAccessTests(TestCase):
    """Группирует тестовые сценарии класса `ChatAccessTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        self.owner = User.objects.create_user(username='owner', password='pass12345')
        self.member = User.objects.create_user(username='member', password='pass12345')
        self.other = User.objects.create_user(username='other', password='pass12345')

        self.private_room = Room.objects.create(
            name='private',
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(self.private_room, self.owner, role_name="Owner")
        ensure_membership(self.private_room, self.member, role_name="Member")

    def test_public_room_permissions(self):
        """Проверяет сценарий `test_public_room_permissions`."""
        public_room = Room.objects.create(name='public', kind=Room.Kind.PUBLIC)

        self.assertTrue(can_read(public_room, AnonymousUser()))
        self.assertFalse(can_write(public_room, AnonymousUser()))
        self.assertTrue(can_write(public_room, self.owner))

    def test_get_user_role_returns_none_for_guest(self):
        """Проверяет сценарий `test_get_user_role_returns_none_for_guest`."""
        self.assertIsNone(get_user_role(self.private_room, AnonymousUser()))

    def test_private_room_permissions(self):
        """Проверяет сценарий `test_private_room_permissions`."""
        self.assertFalse(can_read(self.private_room, AnonymousUser()))
        self.assertFalse(can_write(self.private_room, AnonymousUser()))
        self.assertTrue(can_read(self.private_room, self.member))
        self.assertTrue(can_write(self.private_room, self.member))

    def test_public_group_non_member_is_read_only_until_join(self):
        group = Room.objects.create(
            name='Public Group',
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.owner,
        )
        ensure_membership(group, self.owner, role_name="Owner")

        self.assertTrue(can_read(group, self.other))
        self.assertFalse(can_write(group, self.other))

        ensure_membership(group, self.other, role_name="Member")
        self.assertTrue(can_write(group, self.other))


    def test_direct_room_without_pair_key_denied(self):
        """Проверяет сценарий `test_direct_room_without_pair_key_denied`."""
        direct = Room.objects.create(
            name='dm',
            kind=Room.Kind.DIRECT,
            direct_pair_key=None,
            created_by=self.owner,
        )
        ensure_membership(direct, self.owner)

        self.assertFalse(can_read(direct, self.owner))
        self.assertFalse(can_write(direct, self.owner))

    def test_direct_room_pair_key_is_strict(self):
        """Проверяет сценарий `test_direct_room_pair_key_is_strict`."""
        direct = Room.objects.create(
            name='dm',
            kind=Room.Kind.DIRECT,
            direct_pair_key='not-valid',
            created_by=self.owner,
        )
        ensure_membership(direct, self.owner)

        self.assertFalse(can_read(direct, self.owner))
        self.assertFalse(can_write(direct, self.owner))

    def test_direct_room_denies_third_user_even_with_role(self):
        """Проверяет сценарий `test_direct_room_denies_third_user_even_with_role`."""
        direct = Room.objects.create(
            name='dm',
            kind=Room.Kind.DIRECT,
            direct_pair_key=f'{self.owner.pk}:{self.member.pk}',
            created_by=self.owner,
        )
        ensure_membership(direct, self.other, role_name="Admin")

        self.assertFalse(can_read(direct, self.other))
        self.assertFalse(can_write(direct, self.other))

    def test_ensure_helpers(self):
        """Проверяет сценарий `test_ensure_helpers`."""
        with self.assertRaises(Http404):
            ensure_can_read_or_404(self.private_room, self.other)

        self.assertFalse(ensure_can_write(self.private_room, self.other))
        self.assertTrue(ensure_can_write(self.private_room, self.owner))
