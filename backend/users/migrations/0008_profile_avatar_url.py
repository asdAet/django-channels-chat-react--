from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0007_remove_emailidentity_password_hash_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="avatar_url",
            field=models.URLField(blank=True, default=""),
        ),
    ]
