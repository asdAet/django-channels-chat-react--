"""Convert Message.room from CharField (slug) to ForeignKey(Room).

Steps:
1. Add room_fk nullable FK column
2. Populate room_fk from room slug
3. Drop old room CharField and indexes
4. Rename room_fk to room_id
5. Add new indexes
"""

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def populate_room_fk(apps, schema_editor):
    Message = apps.get_model("chat_messages", "Message")
    Room = apps.get_model("rooms", "Room")

    room_map = dict(Room.objects.values_list("slug", "id"))

    batch = []
    for msg in Message.objects.all().iterator(chunk_size=1000):
        room_id = room_map.get(msg.room)
        if room_id:
            msg.room_fk_id = room_id
            batch.append(msg)
        if len(batch) >= 1000:
            Message.objects.bulk_update(batch, ["room_fk"], batch_size=1000)
            batch = []
    if batch:
        Message.objects.bulk_update(batch, ["room_fk"], batch_size=1000)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("chat_messages", "0001_initial"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        # 1. Add nullable FK column
        migrations.AddField(
            model_name="message",
            name="room_fk",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="+",
                to="rooms.room",
                db_column="room_fk_id",
            ),
        ),
        # 2. Populate FK from slug
        migrations.RunPython(populate_room_fk, noop),
        # 3. Remove old CharField room and its indexes
        migrations.RemoveIndex(
            model_name="message",
            name="chat_msg_room_date_idx",
        ),
        migrations.RemoveIndex(
            model_name="message",
            name="chat_msg_user_date_idx",
        ),
        migrations.RemoveField(
            model_name="message",
            name="room",
        ),
        # 4. Rename room_fk to room
        migrations.RenameField(
            model_name="message",
            old_name="room_fk",
            new_name="room",
        ),
        # 5. Make it non-nullable
        migrations.AlterField(
            model_name="message",
            name="room",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messages",
                to="rooms.room",
            ),
        ),
        # 6. Add new indexes
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["room", "date_added"], name="msg_room_date_idx"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["username", "date_added"], name="msg_user_date_idx"),
        ),
    ]
