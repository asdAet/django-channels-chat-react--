"""Integration checks for user action audit coverage."""

from __future__ import annotations

import json

from django.test import Client, TestCase

from auditlog.models import AuditEvent
from users.application import auth_service
from users.identity import ensure_user_identity_core, set_user_public_handle


class UserActionsAuditCoverageTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)

    def _csrf(self) -> str:
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", response.cookies)
        return response.cookies["csrftoken"].value

    def test_register_profile_and_presence_actions_are_audited(self):
        csrf = self._csrf()
        register_response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "login": "audit_user_login",
                    "password": "pass12345",
                    "passwordConfirm": "pass12345",
                    "name": "Audit User",
                    "email": "audit_user@example.com",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(register_response.status_code, 201)
        user_id = register_response.json()["user"]["id"]

        csrf = self._csrf()
        profile_response = self.client.patch(
            "/api/profile/",
            data=json.dumps({"name": "Audit User Updated"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(profile_response.status_code, 200)

        presence_response = self.client.get("/api/auth/presence-session/")
        self.assertEqual(presence_response.status_code, 200)

        self.assertTrue(
            AuditEvent.objects.filter(
                action="auth.register.success",
                path="/api/auth/register/",
                actor_user_id_snapshot=user_id,
            ).exists()
        )
        self.assertTrue(
            AuditEvent.objects.filter(
                action="auth.profile.update.success",
                path="/api/profile/",
                actor_user_id_snapshot=user_id,
            ).exists()
        )
        self.assertTrue(
            AuditEvent.objects.filter(
                action="presence.session.bootstrap",
                path="/api/auth/presence-session/",
                actor_user_id_snapshot=user_id,
            ).exists()
        )
        self.assertTrue(
            AuditEvent.objects.filter(
                action="http.request",
                path="/api/profile/",
                actor_user_id_snapshot=user_id,
                status_code=200,
            ).exists()
        )

    def test_login_failed_and_success_actions_are_audited(self):
        user = auth_service.register_user(
            login="audit_login_user",
            password="pass12345",
            password_confirm="pass12345",
            name="Audit Login User",
            username="auditloginuser",
            email="audit_login_user@example.com",
        )
        self.client.logout()

        csrf = self._csrf()
        bad_login = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"identifier": "audit_login_user", "password": "wrong"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(bad_login.status_code, 400)

        csrf = self._csrf()
        ok_login = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"identifier": "audit_login_user", "password": "pass12345"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(ok_login.status_code, 200)

        self.assertTrue(
            AuditEvent.objects.filter(
                action="auth.login.failed",
                path="/api/auth/login/",
            ).exists()
        )
        self.assertTrue(
            AuditEvent.objects.filter(
                action="auth.login.success",
                path="/api/auth/login/",
                actor_user_id_snapshot=user.pk,
            ).exists()
        )
        self.assertGreaterEqual(
            AuditEvent.objects.filter(
                action="http.request",
                path="/api/auth/login/",
            ).count(),
            2,
        )

    def test_chat_resolve_direct_action_is_audited_for_actor(self):
        actor = auth_service.register_user(
            login="audit_direct_actor",
            password="pass12345",
            password_confirm="pass12345",
            name="Audit Direct Actor",
            username="auditdirectactor",
            email="audit_direct_actor@example.com",
        )
        peer = auth_service.register_user(
            login="audit_direct_peer",
            password="pass12345",
            password_confirm="pass12345",
            name="Audit Direct Peer",
            username="auditdirectpeer",
            email="audit_direct_peer@example.com",
        )
        ensure_user_identity_core(actor)
        ensure_user_identity_core(peer)
        set_user_public_handle(peer, "auditdirectpeer")

        self.client.force_login(actor)
        csrf = self._csrf()
        response = self.client.post(
            "/api/chat/resolve/",
            data=json.dumps({"target": "@auditdirectpeer"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)

        self.assertTrue(
            AuditEvent.objects.filter(
                action="http.request",
                path="/api/chat/resolve/",
                actor_user_id_snapshot=actor.pk,
                status_code=200,
            ).exists()
        )
