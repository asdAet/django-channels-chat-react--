"""State-only migration: register Room model in rooms app (table chat_room already exists)."""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chat", "0010_move_models_out"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="Room",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("name", models.CharField(db_index=True, max_length=50)),
                        ("slug", models.CharField(max_length=50, unique=True)),
                        ("kind", models.CharField(choices=[("public", "Public"), ("private", "Private"), ("direct", "Direct")], db_index=True, default="private", max_length=10)),
                        ("direct_pair_key", models.CharField(blank=True, db_index=True, max_length=64, null=True, unique=True)),
                        ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_rooms", to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        "db_table": "chat_room",
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
