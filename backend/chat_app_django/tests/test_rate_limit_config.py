from django.test import SimpleTestCase, override_settings

from chat_app_django.security.rate_limit_config import (
    auth_rate_limit_disabled,
    auth_rate_limit_policy,
    chat_message_rate_limit_disabled,
    chat_message_rate_limit_policy,
    ws_connect_rate_limit_disabled,
    ws_connect_rate_limit_policy,
)


class RateLimitConfigTests(SimpleTestCase):
    @override_settings(
        RATE_LIMITS={
            "auth_attempts": {"limit": 11, "window_seconds": 44, "disabled": True},
            "chat_message_send": {"limit": 22, "window_seconds": 55, "disabled": True},
            "ws_connect_default": {"limit": 33, "window_seconds": 66},
            "ws_connect_presence": {"limit": 77, "window_seconds": 88},
            "ws_connect": {"disabled": True},
        },
    )
    def test_uses_centralized_rate_limits_mapping(self):
        auth = auth_rate_limit_policy()
        self.assertEqual(auth.limit, 11)
        self.assertEqual(auth.window_seconds, 44)
        self.assertTrue(auth_rate_limit_disabled())

        chat = chat_message_rate_limit_policy()
        self.assertEqual(chat.limit, 22)
        self.assertEqual(chat.window_seconds, 55)
        self.assertTrue(chat_message_rate_limit_disabled())

        ws_default = ws_connect_rate_limit_policy("chat")
        self.assertEqual(ws_default.limit, 33)
        self.assertEqual(ws_default.window_seconds, 66)

        ws_presence = ws_connect_rate_limit_policy("presence")
        self.assertEqual(ws_presence.limit, 77)
        self.assertEqual(ws_presence.window_seconds, 88)

        self.assertTrue(ws_connect_rate_limit_disabled())

    @override_settings(
        RATE_LIMITS={},
    )
    def test_defaults_are_used_when_rate_limits_section_missing(self):
        auth = auth_rate_limit_policy()
        self.assertEqual(auth.limit, 10)
        self.assertEqual(auth.window_seconds, 60)
        self.assertFalse(auth_rate_limit_disabled())

        chat = chat_message_rate_limit_policy()
        self.assertEqual(chat.limit, 20)
        self.assertEqual(chat.window_seconds, 10)
        self.assertFalse(chat_message_rate_limit_disabled())

        ws_default = ws_connect_rate_limit_policy("chat")
        self.assertEqual(ws_default.limit, 60)
        self.assertEqual(ws_default.window_seconds, 60)

        ws_presence = ws_connect_rate_limit_policy("presence")
        self.assertEqual(ws_presence.limit, 180)
        self.assertEqual(ws_presence.window_seconds, 60)

        self.assertFalse(ws_connect_rate_limit_disabled())
