"""State-only migration: register Message model in messages app (table chat_message already exists).

This first registers the model with room as CharField (matching current DB schema).
"""

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("rooms", "0001_initial"),
        ("chat", "0010_move_models_out"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="Message",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("username", models.CharField(db_index=True, max_length=50)),
                        ("message_content", models.TextField()),
                        ("date_added", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                        ("profile_pic", models.CharField(blank=True, max_length=255, null=True)),
                        ("room", models.CharField(db_index=True, max_length=50)),
                        ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="chat_messages", to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        "db_table": "chat_message",
                        "ordering": ("date_added",),
                        "indexes": [
                            models.Index(fields=["room", "date_added"], name="chat_msg_room_date_idx"),
                            models.Index(fields=["username", "date_added"], name="chat_msg_user_date_idx"),
                        ],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
