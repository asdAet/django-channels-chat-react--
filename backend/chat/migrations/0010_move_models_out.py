"""Remove Room, ChatRole, Message from chat app state (models moved to rooms, roles, messages apps).

This is state-only: no database tables are dropped.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0009_seed_room_kind_and_roles"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveIndex(
                    model_name="message",
                    name="chat_msg_room_date_idx",
                ),
                migrations.RemoveIndex(
                    model_name="message",
                    name="chat_msg_user_date_idx",
                ),
                migrations.RemoveConstraint(
                    model_name="chatrole",
                    name="chat_role_room_user_uniq",
                ),
                migrations.RemoveIndex(
                    model_name="chatrole",
                    name="chat_role_room_role_idx",
                ),
                migrations.DeleteModel(name="Message"),
                migrations.DeleteModel(name="ChatRole"),
                migrations.DeleteModel(name="Room"),
            ],
            database_operations=[],
        ),
    ]
