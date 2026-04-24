"""Содержит тесты модуля `test_health` подсистемы `chat`."""


from django.test import TestCase, override_settings


class HealthApiTests(TestCase):
    """Группирует тестовые сценарии класса `HealthApiTests`."""
    def test_live_health_endpoint(self):
        """Проверяет сценарий `test_live_health_endpoint`."""
        response = self.client.get('/api/health/live/')
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['status'], 'ok')
        self.assertEqual(payload['check'], 'live')

    def test_ready_health_endpoint(self):
        """Проверяет сценарий `test_ready_health_endpoint`."""
        response = self.client.get('/api/health/ready/')
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['status'], 'ok')
        self.assertEqual(payload['check'], 'ready')
        self.assertEqual(payload['components']['database'], 'ok')
        self.assertEqual(payload['components']['cache'], 'ok')

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_health_endpoints_bypass_secure_ssl_redirect(self):
        live_response = self.client.get('/api/health/live/')
        ready_response = self.client.get('/api/health/ready/')

        self.assertEqual(live_response.status_code, 200)
        self.assertEqual(ready_response.status_code, 200)

    def test_live_health_endpoint_accepts_internal_nginx_host(self):
        response = self.client.get('/api/health/live/', HTTP_HOST='nginx')

        self.assertEqual(response.status_code, 200)
