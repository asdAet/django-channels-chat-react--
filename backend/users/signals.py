"""Signals for profile bootstrap and public identity snapshot synchronization."""

from __future__ import annotations

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event
from messages.models import Message

from .identity import ensure_user_identity_core, user_public_username
from .models import Profile, PublicHandle


@receiver(pre_save, sender=User)
def remember_previous_username(sender, instance, **kwargs):
    """Вспомогательная функция `remember_previous_username` реализует внутренний шаг бизнес-логики.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    if kwargs.get("raw", False):
        return
    if not instance.pk:
        instance._old_username = None
        return
    old_username = User.objects.filter(pk=instance.pk).values_list("username", flat=True).first()
    instance._old_username = old_username


@receiver(post_save, sender=User)
def ensure_profile(sender, instance, **kwargs):
    """Гарантирует корректность profile перед выполнением операции.
    
    Args:
        sender: Источник сигнала Django.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    if kwargs.get("raw", False):
        return
    defaults = {"name": (instance.first_name or "").strip()}
    try:
        profile, created = Profile.objects.get_or_create(user=instance, defaults=defaults)
    except IntegrityError:
        profile = Profile.objects.filter(user=instance).first()
        created = False

    if profile and not created and not profile.name and instance.first_name:
        profile.name = instance.first_name.strip()
        profile.save(update_fields=["name"])

    # User public fallback-id must exist for every account.
    ensure_user_identity_core(instance)


@receiver(post_save, sender=User)
def sync_chat_username_snapshots(sender, instance, **kwargs):
    """Синхронизирует чат имя пользователя снимки состояния.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    if kwargs.get("raw", False):
        return
    old_username = getattr(instance, "_old_username", None)
    public_snapshot = user_public_username(instance)
    if old_username and old_username == instance.username:
        return

    Message.objects.filter(user=instance).exclude(username=public_snapshot).update(username=public_snapshot)
    if old_username:
        audit_security_event(
            "user.username.changed",
            actor_user=instance,
            actor_user_id=instance.id,
            actor_username=public_snapshot,
            is_authenticated=True,
            old_username=old_username,
            new_username=instance.username,
        )


@receiver(post_save, sender=PublicHandle)
def sync_chat_handle_snapshot_on_save(sender, instance, **kwargs):
    """Синхронизирует чат handle snapshot on сохранение.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    if kwargs.get("raw", False):
        return
    user = getattr(instance, "user", None)
    if user is None:
        return

    new_username = user_public_username(user)
    Message.objects.filter(user=user).exclude(username=new_username).update(username=new_username)
    audit_security_event(
        "public_handle.user.updated",
        actor_user=user,
        actor_user_id=user.id,
        actor_username=new_username,
        is_authenticated=True,
        handle=instance.handle,
    )


@receiver(post_delete, sender=PublicHandle)
def sync_chat_handle_snapshot_on_delete(sender, instance, **kwargs):
    """Синхронизирует чат handle snapshot on удаление.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        instance: Экземпляр модели или доменного объекта.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    user = getattr(instance, "user", None)
    if user is None:
        return

    new_username = user_public_username(user)
    Message.objects.filter(user=user).exclude(username=new_username).update(username=new_username)
    audit_security_event(
        "public_handle.user.deleted",
        actor_user=user,
        actor_user_id=user.id,
        actor_username=new_username,
        is_authenticated=True,
    )
