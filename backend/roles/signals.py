from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event

from .models import Membership, Role


@receiver(post_save, sender=Membership)
def audit_membership_save(sender, instance: Membership, created: bool, **kwargs):
    """Фиксирует membership save в системе аудита.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        created: Флаг создания новой записи.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    audit_security_event(
        "membership.created" if created else "membership.updated",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_id=getattr(instance.room, "pk", None),
        username=getattr(instance.user, "username", None),
        is_banned=instance.is_banned,
    )


@receiver(post_delete, sender=Membership)
def audit_membership_delete(sender, instance: Membership, **kwargs):
    """Фиксирует membership delete в системе аудита.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    audit_security_event(
        "membership.deleted",
        actor_user=instance.user,
        actor_user_id=getattr(instance.user, "id", None),
        actor_username=getattr(instance.user, "username", None),
        is_authenticated=bool(getattr(instance.user, "is_authenticated", False)),
        room_id=getattr(instance.room, "pk", None),
        username=getattr(instance.user, "username", None),
    )


@receiver(post_save, sender=Role)
def audit_role_save(sender, instance: Role, created: bool, **kwargs):
    """Фиксирует role save в системе аудита.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        created: Флаг создания новой записи.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    audit_security_event(
        "role.created" if created else "role.updated",
        room_id=getattr(instance.room, "pk", None),
        role_name=instance.name,
        position=instance.position,
        permissions=instance.permissions,
    )


@receiver(post_delete, sender=Role)
def audit_role_delete(sender, instance: Role, **kwargs):
    """Фиксирует role delete в системе аудита.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    audit_security_event(
        "role.deleted",
        room_id=getattr(instance.room, "pk", None),
        role_name=instance.name,
    )
