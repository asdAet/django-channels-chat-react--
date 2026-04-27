"""Добавляет поля crop-метаданных для аватарки профиля."""

from django.db import migrations, models


class Migration(migrations.Migration):
    """Описывает операции миграции схемы данных."""

    dependencies = [
        ("users", "0004_securityratelimitbucket"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="avatar_crop_height",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="profile",
            name="avatar_crop_width",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="profile",
            name="avatar_crop_x",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="profile",
            name="avatar_crop_y",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
