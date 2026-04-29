from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("users", "0012_alter_profile_image_default"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserTwoFactor",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("secret_encrypted", models.TextField(blank=True, default="")),
                ("enabled_at", models.DateTimeField(blank=True, null=True)),
                ("last_accepted_timestep", models.BigIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="two_factor",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="usertwofactor",
            index=models.Index(fields=["enabled_at"], name="users_2fa_enabled_idx"),
        ),
    ]
