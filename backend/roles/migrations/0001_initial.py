"""State-only migration: register ChatRole model in roles app (table chat_chatrole already exists)."""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("rooms", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="ChatRole",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("role", models.CharField(choices=[("owner", "Owner"), ("admin", "Admin"), ("member", "Member"), ("viewer", "Viewer"), ("blocked", "Blocked")], db_index=True, max_length=16)),
                        ("username_snapshot", models.CharField(db_index=True, max_length=150)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        ("updated_at", models.DateTimeField(auto_now=True)),
                        ("granted_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="granted_chat_roles", to=settings.AUTH_USER_MODEL)),
                        ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="roles", to="rooms.room")),
                        ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_roles", to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        "db_table": "chat_chatrole",
                    },
                ),
                migrations.AddConstraint(
                    model_name="chatrole",
                    constraint=models.UniqueConstraint(fields=("room", "user"), name="chat_role_room_user_uniq"),
                ),
                migrations.AddIndex(
                    model_name="chatrole",
                    index=models.Index(fields=["room", "role"], name="chat_role_room_role_idx"),
                ),
            ],
            database_operations=[],
        ),
    ]
