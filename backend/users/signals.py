"""Signals for profile bootstrap and username snapshot synchronization."""

from __future__ import annotations

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from chat_app_django.security.audit import audit_security_event
from messages.models import Message

from .identity import user_public_username
from .models import Profile


@receiver(pre_save, sender=User)
def remember_previous_username(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if not instance.pk:
        instance._old_username = None
        return
    old_username = (
        User.objects.filter(pk=instance.pk)
        .values_list("username", flat=True)
        .first()
    )
    instance._old_username = old_username


@receiver(post_save, sender=User)
def ensure_profile(sender, instance, **kwargs):
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


@receiver(post_save, sender=User)
def sync_chat_username_snapshots(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    old_username = getattr(instance, "_old_username", None)
    new_username = user_public_username(instance)
    if not old_username or old_username == new_username:
        return

    Message.objects.filter(user=instance).exclude(username=new_username).update(username=new_username)
    audit_security_event(
        "user.username.changed",
        actor_user=instance,
        actor_user_id=instance.id,
        actor_username=new_username,
        is_authenticated=True,
        old_username=old_username,
        new_username=new_username,
    )


@receiver(pre_save, sender=Profile)
def remember_previous_profile_username(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if not instance.pk:
        instance._old_public_username = None
        return
    old_username = (
        Profile.objects.filter(pk=instance.pk)
        .values_list("username", flat=True)
        .first()
    )
    instance._old_public_username = old_username


@receiver(post_save, sender=Profile)
def sync_chat_profile_username_snapshots(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    old_username = getattr(instance, "_old_public_username", None)
    new_username = user_public_username(instance.user)
    if old_username == new_username:
        return

    Message.objects.filter(user=instance.user).exclude(username=new_username).update(username=new_username)
    audit_security_event(
        "profile.username.changed",
        actor_user=instance.user,
        actor_user_id=instance.user_id,
        actor_username=new_username,
        is_authenticated=True,
        old_username=old_username,
        new_username=new_username,
    )
