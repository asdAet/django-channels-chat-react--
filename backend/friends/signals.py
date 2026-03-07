from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event

from .models import Friendship
from .utils import get_from_user_id, get_to_user_id


@receiver(post_save, sender=Friendship)
def audit_friendship_save(sender, instance: Friendship, created: bool, **kwargs):
    from_user_id = get_from_user_id(instance)
    to_user_id = get_to_user_id(instance)
    audit_security_event(
        "friendship.created" if created else "friendship.updated",
        actor_user_id=from_user_id,
        is_authenticated=True,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        status=instance.status,
    )


@receiver(post_delete, sender=Friendship)
def audit_friendship_delete(sender, instance: Friendship, **kwargs):
    from_user_id = get_from_user_id(instance)
    to_user_id = get_to_user_id(instance)
    audit_security_event(
        "friendship.deleted",
        actor_user_id=from_user_id,
        is_authenticated=True,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
    )
