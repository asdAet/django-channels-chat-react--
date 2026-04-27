"""Coverage tests for custom auth backend."""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import RequestFactory, TestCase

from users.auth_backends import EmailIdentityBackend
from users.models import EmailIdentity, LoginIdentity

User = get_user_model()


class EmailIdentityBackendTests(TestCase):
    def setUp(self):
        self.backend = EmailIdentityBackend()
        self.request = RequestFactory().post("/api/auth/login/")
        self.user = User.objects.create_user(username="backend_user", email="backend@example.com")
        self.user.set_unusable_password()
        self.user.save(update_fields=["password"])
        LoginIdentity.objects.create(
            user=self.user,
            login_normalized="backend_login",
            password_hash=make_password("pass12345"),
        )
        EmailIdentity.objects.create(
            user=self.user,
            email_normalized="backend@example.com",
            email_verified=True,
        )

    def test_authenticate_returns_user_for_valid_credentials(self):
        by_email = self.backend.authenticate(
            request=self.request,
            username="  BACKEND@example.com  ",
            password="pass12345",
        )
        self.assertEqual(by_email, self.user)

        by_login = self.backend.authenticate(
            request=self.request,
            username=" backend_login ",
            password="pass12345",
        )
        self.assertEqual(by_login, self.user)

    def test_authenticate_returns_none_for_invalid_inputs(self):
        self.assertIsNone(self.backend.authenticate(request=self.request, username="", password="pass12345"))
        self.assertIsNone(self.backend.authenticate(request=self.request, username="backend@example.com", password=""))
        self.assertIsNone(self.backend.authenticate(request=self.request, username="missing@example.com", password="pass12345"))
        self.assertIsNone(self.backend.authenticate(request=self.request, username="backend@example.com", password="wrong"))

    def test_get_user_returns_user_or_none(self):
        self.assertEqual(self.backend.get_user(self.user.pk), self.user)
        self.assertIsNone(self.backend.get_user(999999))
