"""Remove ChatRole model and fix Role.room related_name."""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("roles", "0002_role_membership_permissionoverride"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        # 1. Remove old ChatRole index and constraint
        migrations.RemoveIndex(
            model_name="chatrole",
            name="chat_role_room_role_idx",
        ),
        migrations.RemoveConstraint(
            model_name="chatrole",
            name="chat_role_room_user_uniq",
        ),

        # 2. Delete ChatRole model (drops chat_chatrole table)
        migrations.DeleteModel(
            name="ChatRole",
        ),

        # 3. Fix Role.room related_name from "roles_new" to "roles"
        migrations.AlterField(
            model_name="role",
            name="room",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="roles",
                to="rooms.room",
            ),
        ),
    ]
