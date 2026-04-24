from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat_messages", "0005_alter_messageattachment_file_size_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reaction",
            name="emoji",
            field=models.CharField(max_length=255),
        ),
    ]
