"""Smoke test for direct_inbox.state exports used by chat runtime."""

from django.test import SimpleTestCase

from direct_inbox import state


class DirectInboxStateModuleTests(SimpleTestCase):
    def test_module_exports_state_functions(self):
        self.assertTrue(callable(state.mark_unread))
        self.assertTrue(callable(state.mark_read))
        self.assertTrue(callable(state.get_unread_state))
