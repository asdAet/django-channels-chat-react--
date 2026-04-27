from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chat_messages", "0003_message_edit_delete_reply_attachment_reaction_readstate"),
    ]

    operations = [
        migrations.CreateModel(
            name="MessageReadReceipt",
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
                (
                    "read_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                    ),
                ),
                (
                    "message",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="read_receipts",
                        to="chat_messages.message",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="message_read_receipts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "messages_read_receipt",
            },
        ),
        migrations.AddConstraint(
            model_name="messagereadreceipt",
            constraint=models.UniqueConstraint(
                fields=("message", "user"),
                name="read_receipt_message_user_uniq",
            ),
        ),
        migrations.AddIndex(
            model_name="messagereadreceipt",
            index=models.Index(
                fields=["message", "read_at"],
                name="read_receipt_msg_read_idx",
            ),
        ),
    ]
