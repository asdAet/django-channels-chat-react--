from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    action = models.CharField(max_length=128, db_index=True)
    protocol = models.CharField(max_length=16, null=True, blank=True, db_index=True)
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    actor_user_id_snapshot = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    actor_username_snapshot = models.CharField(max_length=150, null=True, blank=True, db_index=True)
    is_authenticated = models.BooleanField(default=False, db_index=True)
    method = models.CharField(max_length=16, null=True, blank=True)
    path = models.CharField(max_length=1024, null=True, blank=True)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    success = models.BooleanField(default=False, db_index=True)
    ip = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    request_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at", "id"], name="audit_evt_created_idx"),
            models.Index(
                fields=["actor_user_id_snapshot", "created_at"],
                name="audit_evt_actor_created_idx",
            ),
            models.Index(fields=["action", "created_at"], name="audit_evt_action_created_idx"),
            models.Index(fields=["protocol", "created_at"], name="audit_evt_proto_created_idx"),
            models.Index(
                fields=["status_code", "created_at"],
                name="audit_evt_status_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.created_at.isoformat()} {self.action}"
