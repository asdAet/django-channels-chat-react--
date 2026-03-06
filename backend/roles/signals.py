from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event

from .models import ChatRole


@receiver(post_save, sender=ChatRole)
def audit_chat_role_save(sender, instance: ChatRole, created: bool, **kwargs):
    audit_security_event(
        "chat.role.created" if created else "chat.role.updated",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_slug=getattr(instance.room, "slug", None),
        username=getattr(instance.user, "username", None),
        role=instance.role,
        granted_by=getattr(instance.granted_by, "username", None),
    )


@receiver(post_delete, sender=ChatRole)
def audit_chat_role_delete(sender, instance: ChatRole, **kwargs):
    audit_security_event(
        "chat.role.deleted",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_slug=getattr(instance.room, "slug", None),
        username=getattr(instance.user, "username", None),
        role=instance.role,
    )
