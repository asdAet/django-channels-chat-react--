"""Tests for room-scoped role management endpoints."""

import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from roles.models import PermissionOverride, Role
from roles.permissions import Perm
from rooms.models import Room
from rooms.services import ensure_membership

User = get_user_model()


class RoomRolesApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(username="roles_owner", password="pass12345")
        self.member = User.objects.create_user(username="roles_member", password="pass12345")
        self.other = User.objects.create_user(username="roles_other", password="pass12345")
        self.superuser = User.objects.create_superuser(
            username="roles_superuser",
            email="roles_superuser@example.com",
            password="pass12345",
        )

        self.room = Room.objects.create(
            name="Roles Room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(self.room, self.owner, role_name="Owner")
        ensure_membership(self.room, self.member, role_name="Member")
        ensure_membership(self.room, self.other, role_name="Member")

    def _url(self, suffix: str) -> str:
        return f"/api/chat/{self.room.pk}/{suffix}"

    def test_roles_api_denies_user_without_manage_roles(self):
        self.client.force_login(self.member)
        response = self.client.get(self._url("roles/"))
        self.assertEqual(response.status_code, 403)

    def test_owner_can_create_patch_and_delete_role(self):
        self.client.force_login(self.owner)

        create_response = self.client.post(
            self._url("roles/"),
            data=json.dumps(
                {
                    "name": "Helper",
                    "color": "#3366FF",
                    "position": 30,
                    "permissions": int(Perm.READ_MESSAGES | Perm.SEND_MESSAGES),
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)
        role_id = create_response.json()["item"]["id"]

        patch_response = self.client.patch(
            self._url(f"roles/{role_id}/"),
            data=json.dumps({"color": "#00AA99"}),
            content_type="application/json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["item"]["color"], "#00AA99")

        delete_response = self.client.delete(self._url(f"roles/{role_id}/"))
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Role.objects.filter(id=role_id).exists())

    def test_owner_cannot_create_role_at_same_hierarchy_position(self):
        self.client.force_login(self.owner)
        response = self.client.post(
            self._url("roles/"),
            data=json.dumps(
                {
                    "name": "TooHigh",
                    "position": 80,
                    "permissions": int(Perm.READ_MESSAGES),
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_member_roles_get_and_patch(self):
        self.client.force_login(self.owner)
        role = Role.objects.create(
            room=self.room,
            name="Reporter",
            color="#445566",
            position=25,
            permissions=int(Perm.READ_MESSAGES),
            is_default=False,
        )
        role_pk = role.pk
        self.assertIsNotNone(role_pk)

        patch_response = self.client.patch(
            self._url(f"members/{self.member.pk}/roles/"),
            data=json.dumps({"roleIds": [int(role_pk)]}),
            content_type="application/json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["item"]["roleIds"], [int(role_pk)])

        get_response = self.client.get(self._url(f"members/{self.member.pk}/roles/"))
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["item"]["roleIds"], [int(role_pk)])

    def test_member_roles_reject_cross_room_role_id(self):
        other_room = Room.objects.create(
            name="Other Roles Room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(other_room, self.owner, role_name="Owner")
        foreign_role = Role.objects.create(
            room=other_room,
            name="Foreign",
            color="#111111",
            position=10,
            permissions=int(Perm.READ_MESSAGES),
            is_default=False,
        )
        foreign_role_pk = foreign_role.pk
        self.assertIsNotNone(foreign_role_pk)

        self.client.force_login(self.owner)
        response = self.client.patch(
            self._url(f"members/{self.member.pk}/roles/"),
            data=json.dumps({"roleIds": [int(foreign_role_pk)]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_overrides_crud(self):
        self.client.force_login(self.owner)
        role = Role.objects.create(
            room=self.room,
            name="Reporter",
            color="#445566",
            position=25,
            permissions=int(Perm.READ_MESSAGES),
            is_default=False,
        )
        role_pk = role.pk
        self.assertIsNotNone(role_pk)

        create_response = self.client.post(
            self._url("overrides/"),
            data=json.dumps(
                {
                    "targetRoleId": int(role_pk),
                    "allow": int(Perm.SEND_MESSAGES),
                    "deny": 0,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)
        override_id = create_response.json()["item"]["id"]

        list_response = self.client.get(self._url("overrides/"))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()["items"]), 1)

        patch_response = self.client.patch(
            self._url(f"overrides/{override_id}/"),
            data=json.dumps({"deny": int(Perm.ATTACH_FILES)}),
            content_type="application/json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["item"]["deny"], int(Perm.ATTACH_FILES))

        delete_response = self.client.delete(self._url(f"overrides/{override_id}/"))
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(PermissionOverride.objects.filter(id=override_id).exists())

    def test_permissions_me_returns_effective_flags(self):
        self.client.force_login(self.owner)
        response = self.client.get(self._url("permissions/me/"))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["roomId"], self.room.pk)
        self.assertTrue(payload["isMember"])
        self.assertFalse(payload["isBanned"])
        self.assertFalse(payload["canJoin"])
        self.assertTrue(payload["can"]["read"])
        self.assertTrue(payload["can"]["write"])
        self.assertTrue(payload["can"]["manageRoles"])
        self.assertIn("ADMINISTRATOR", payload["flags"])

    def test_permissions_me_for_public_group_non_member_is_read_only_joinable(self):
        public_group = Room.objects.create(
            name="Roles Public",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.owner,
        )
        ensure_membership(public_group, self.owner, role_name="Owner")

        self.client.force_login(self.member)
        response = self.client.get(f"/api/chat/{public_group.pk}/permissions/me/")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertFalse(payload["isMember"])
        self.assertFalse(payload["isBanned"])
        self.assertTrue(payload["canJoin"])
        self.assertTrue(payload["can"]["read"])
        self.assertFalse(payload["can"]["write"])

    def test_direct_room_rejects_role_management(self):
        direct_room = Room.objects.create(
            name="dm",
            kind=Room.Kind.DIRECT,
            direct_pair_key=f"{self.owner.pk}:{self.member.pk}",
            created_by=self.owner,
        )
        ensure_membership(direct_room, self.owner)
        ensure_membership(direct_room, self.member)

        self.client.force_login(self.owner)
        response = self.client.get(f"/api/chat/{direct_room.pk}/roles/")
        self.assertEqual(response.status_code, 400)

    def test_permissions_me_hides_private_room_for_outsider(self):
        hidden_room = Room.objects.create(
            name="Hidden",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(hidden_room, self.owner, role_name="Owner")

        self.client.force_login(self.member)
        response = self.client.get(f"/api/chat/{hidden_room.pk}/permissions/me/")
        self.assertEqual(response.status_code, 404)

    def test_superuser_can_manage_roles_without_room_membership(self):
        self.client.force_login(self.superuser)

        create_response = self.client.post(
            self._url("roles/"),
            data=json.dumps(
                {
                    "name": "SuperManaged",
                    "color": "#AA55EE",
                    "position": 100,
                    "permissions": int(Perm.READ_MESSAGES | Perm.SEND_MESSAGES),
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)
        role_id = create_response.json()["item"]["id"]

        delete_response = self.client.delete(self._url(f"roles/{role_id}/"))
        self.assertEqual(delete_response.status_code, 204)
