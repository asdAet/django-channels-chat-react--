from django.db import migrations


def purge_soft_deleted_messages(apps, schema_editor):
    Message = apps.get_model("chat_messages", "Message")
    Message.objects.filter(is_deleted=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("chat_messages", "0006_alter_reaction_emoji"),
    ]

    operations = [
        migrations.RunPython(
            purge_soft_deleted_messages,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
