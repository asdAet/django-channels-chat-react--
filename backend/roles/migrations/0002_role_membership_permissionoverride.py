"""Add Role, Membership, PermissionOverride models and migrate data from ChatRole."""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

# Permission preset constants (raw int values for migration safety)
_PERM_ADMINISTRATOR = 1 << 32
_PERM_SEND = 1 << 0
_PERM_READ = 1 << 1
_PERM_ATTACH = 1 << 2
_PERM_EMBED = 1 << 3
_PERM_REACTIONS = 1 << 5
_PERM_MANAGE_MSG = 1 << 8
_PERM_KICK = 1 << 9
_PERM_BAN = 1 << 10
_PERM_MUTE = 1 << 11
_PERM_MANAGE_ROLES = 1 << 16
_PERM_MANAGE_ROOM = 1 << 17
_PERM_MANAGE_INVITES = 1 << 18
_PERM_VIEW_AUDIT = 1 << 19

PRESET_OWNER = _PERM_ADMINISTRATOR
PRESET_ADMIN = (
    _PERM_SEND | _PERM_READ | _PERM_ATTACH | _PERM_EMBED
    | _PERM_REACTIONS | _PERM_MANAGE_MSG | _PERM_KICK
    | _PERM_BAN | _PERM_MUTE | _PERM_MANAGE_INVITES | _PERM_VIEW_AUDIT
)
PRESET_MEMBER = _PERM_SEND | _PERM_READ | _PERM_ATTACH | _PERM_EMBED | _PERM_REACTIONS
PRESET_VIEWER = _PERM_READ
EVERYONE_PUBLIC = _PERM_SEND | _PERM_READ | _PERM_REACTIONS
EVERYONE_PRIVATE = 0

OLD_ROLE_MAP = {
    "owner": ("Owner", 80, PRESET_OWNER),
    "admin": ("Admin", 60, PRESET_ADMIN),
    "member": ("Member", 20, PRESET_MEMBER),
    "viewer": ("Viewer", 10, PRESET_VIEWER),
    "blocked": None,  # handled via is_banned
}


def migrate_chatrole_data(apps, schema_editor):
    """Copy data from old ChatRole table into new Role + Membership tables."""
    OldChatRole = apps.get_model("roles", "ChatRole")
    Role = apps.get_model("roles", "Role")
    Membership = apps.get_model("roles", "Membership")
    Room = apps.get_model("rooms", "Room")

    # Gather all rooms that have ChatRole entries
    room_ids = set(OldChatRole.objects.values_list("room_id", flat=True).distinct())

    for room_id in room_ids:
        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            continue

        # Skip role creation for DM rooms (access is pair_key based)
        role_objects = {}
        if room.kind != "direct":
            everyone_perms = EVERYONE_PUBLIC if room.kind == "public" else EVERYONE_PRIVATE
            defaults_spec = [
                ("@everyone", 0, everyone_perms, True),
                ("Viewer", 10, PRESET_VIEWER, False),
                ("Member", 20, PRESET_MEMBER, False),
                ("Admin", 60, PRESET_ADMIN, False),
                ("Owner", 80, PRESET_OWNER, False),
            ]
            for name, position, perms, is_def in defaults_spec:
                role_obj, _ = Role.objects.get_or_create(
                    room=room,
                    name=name,
                    defaults={
                        "position": position,
                        "permissions": perms,
                        "is_default": is_def,
                    },
                )
                role_objects[name] = role_obj

        # Migrate each ChatRole to Membership
        for old in OldChatRole.objects.filter(room_id=room_id).select_related("user"):
            is_banned = old.role == "blocked"
            membership, _ = Membership.objects.get_or_create(
                room=room,
                user=old.user,
                defaults={
                    "is_banned": is_banned,
                },
            )
            if is_banned:
                membership.is_banned = True
                membership.save(update_fields=["is_banned"])
                continue

            mapping = OLD_ROLE_MAP.get(old.role)
            if mapping and mapping[0] in role_objects:
                membership.roles.add(role_objects[mapping[0]])


def reverse_migration(apps, schema_editor):
    """No reverse — old ChatRole data is preserved in the table."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("roles", "0001_initial"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        # 1. Create Role table
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("color", models.CharField(default="#99AAB5", help_text="Hex color code, e.g. #FF0000", max_length=7)),
                ("position", models.PositiveIntegerField(default=0, help_text="Higher position = more authority.")),
                ("permissions", models.BigIntegerField(default=0, help_text="Bitwise permission mask.")),
                ("is_default", models.BooleanField(default=False, help_text="If True, this is the @everyone role.")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="roles_new", to="rooms.room")),
            ],
            options={
                "db_table": "roles_role",
                "ordering": ["-position"],
            },
        ),
        migrations.AddConstraint(
            model_name="role",
            constraint=models.UniqueConstraint(fields=("room", "name"), name="role_room_name_uniq"),
        ),
        migrations.AddIndex(
            model_name="role",
            index=models.Index(fields=["room", "position"], name="role_room_position_idx"),
        ),

        # 2. Create Membership table
        migrations.CreateModel(
            name="Membership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nickname", models.CharField(blank=True, default="", max_length=32)),
                ("is_banned", models.BooleanField(default=False)),
                ("ban_reason", models.TextField(blank=True, default="")),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="rooms.room")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="room_memberships", to=settings.AUTH_USER_MODEL)),
                ("banned_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bans_issued", to=settings.AUTH_USER_MODEL)),
                ("roles", models.ManyToManyField(blank=True, related_name="members", to="roles.role")),
            ],
            options={
                "db_table": "roles_membership",
            },
        ),
        migrations.AddConstraint(
            model_name="membership",
            constraint=models.UniqueConstraint(fields=("room", "user"), name="membership_room_user_uniq"),
        ),
        migrations.AddIndex(
            model_name="membership",
            index=models.Index(fields=["user", "room"], name="membership_user_room_idx"),
        ),

        # 3. Create PermissionOverride table
        migrations.CreateModel(
            name="PermissionOverride",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("allow", models.BigIntegerField(default=0)),
                ("deny", models.BigIntegerField(default=0)),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="permission_overrides", to="rooms.room")),
                ("target_role", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="overrides", to="roles.role")),
                ("target_user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="permission_overrides", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "roles_permissionoverride",
            },
        ),
        migrations.AddConstraint(
            model_name="permissionoverride",
            constraint=models.CheckConstraint(
                check=models.Q(target_role__isnull=False) | models.Q(target_user__isnull=False),
                name="override_has_target",
            ),
        ),

        # 4. Migrate data from ChatRole
        migrations.RunPython(migrate_chatrole_data, reverse_migration),
    ]
