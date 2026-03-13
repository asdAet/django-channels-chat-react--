"""ORM repositories for role permissions and management."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from roles.models import Membership, PermissionOverride, Role
from rooms.models import Room

User = get_user_model()


def get_room_by_slug(room_slug: str) -> Room | None:
    return Room.objects.filter(slug=room_slug).first()


def get_default_role_permissions(room: Room) -> int | None:
    return (
        Role.objects.filter(room=room, is_default=True)
        .values_list("permissions", flat=True)
        .first()
    )


def get_membership(room: Room, user) -> Membership | None:
    return (
        Membership.objects.filter(room=room, user=user)
        .prefetch_related("roles")
        .first()
    )


def get_membership_by_user_id(room: Room, user_id: int) -> Membership | None:
    return (
        Membership.objects.filter(room=room, user_id=user_id)
        .select_related("user")
        .prefetch_related("roles")
        .first()
    )


def list_memberships(room: Room) -> QuerySet[Membership]:
    return Membership.objects.filter(room=room).select_related("user").prefetch_related("roles")


def list_roles(room: Room) -> QuerySet[Role]:
    return Role.objects.filter(room=room).order_by("-position", "id")


def get_role(room: Room, role_id: int) -> Role | None:
    return Role.objects.filter(room=room, id=role_id).first()


def list_overrides(room: Room) -> QuerySet[PermissionOverride]:
    return PermissionOverride.objects.filter(room=room).order_by("id")


def get_override(room: Room, override_id: int) -> PermissionOverride | None:
    return (
        PermissionOverride.objects.filter(room=room, id=override_id)
        .select_related("target_role", "target_user")
        .first()
    )


def get_user_by_id(user_id: int):
    return User.objects.filter(id=user_id).first()

