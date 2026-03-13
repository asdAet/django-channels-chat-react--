from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event

from .models import Membership, Role


@receiver(post_save, sender=Membership)
def audit_membership_save(sender, instance: Membership, created: bool, **kwargs):
    audit_security_event(
        "membership.created" if created else "membership.updated",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_slug=getattr(instance.room, "slug", None),
        username=getattr(instance.user, "username", None),
        is_banned=instance.is_banned,
    )


@receiver(post_delete, sender=Membership)
def audit_membership_delete(sender, instance: Membership, **kwargs):
    audit_security_event(
        "membership.deleted",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_slug=getattr(instance.room, "slug", None),
        username=getattr(instance.user, "username", None),
    )


@receiver(post_save, sender=Role)
def audit_role_save(sender, instance: Role, created: bool, **kwargs):
    audit_security_event(
        "role.created" if created else "role.updated",
        room_slug=getattr(instance.room, "slug", None),
        role_name=instance.name,
        position=instance.position,
        permissions=instance.permissions,
    )


@receiver(post_delete, sender=Role)
def audit_role_delete(sender, instance: Role, **kwargs):
    audit_security_event(
        "role.deleted",
        room_slug=getattr(instance.room, "slug", None),
        role_name=instance.name,
    )
