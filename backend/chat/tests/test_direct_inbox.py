"""Tests for direct inbox cache-backed state helpers."""

from django.core.cache import cache
from django.test import TestCase

from direct_inbox.state import (
    active_key,
    clear_active_room,
    get_unread_room_ids,
    get_unread_state,
    is_room_active,
    mark_read,
    mark_unread,
    set_active_room,
    touch_active_room,
    unread_key,
    user_group_name,
)


class DirectInboxCacheTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user_id = 10

    def test_group_name_and_keys(self):
        self.assertEqual(user_group_name(self.user_id), "direct_inbox_user_10")
        self.assertEqual(unread_key(self.user_id), "direct:unread:10")
        self.assertEqual(active_key(self.user_id), "direct:active:10")

    def test_get_unread_room_ids_normalizes_non_numeric_and_duplicates(self):
        cache.set(unread_key(self.user_id), [101, None, 101, " ", "202"], timeout=60)
        self.assertEqual(get_unread_room_ids(self.user_id), [101, 202])

    def test_mark_unread_ignores_invalid_room_id(self):
        state = mark_unread(self.user_id, " ", ttl_seconds=60)
        self.assertEqual(state, {"dialogs": 0, "roomIds": [], "counts": {}})

    def test_mark_unread_adds_dialog_once(self):
        mark_unread(self.user_id, 101, ttl_seconds=60)
        state = mark_unread(self.user_id, 101, ttl_seconds=60)
        self.assertEqual(state, {"dialogs": 1, "roomIds": [101], "counts": {"101": 2}})

    def test_mark_read_handles_invalid_room_id(self):
        mark_unread(self.user_id, 101, ttl_seconds=60)
        state = mark_read(self.user_id, "", ttl_seconds=60)
        self.assertEqual(state, {"dialogs": 1, "roomIds": [101], "counts": {"101": 1}})

    def test_mark_read_clears_cache_when_last_dialog_removed(self):
        mark_unread(self.user_id, 101, ttl_seconds=60)
        state = mark_read(self.user_id, 101, ttl_seconds=60)
        self.assertEqual(state, {"dialogs": 0, "roomIds": [], "counts": {}})
        self.assertIsNone(cache.get(unread_key(self.user_id)))

    def test_mark_read_keeps_other_dialogs(self):
        mark_unread(self.user_id, 101, ttl_seconds=60)
        mark_unread(self.user_id, 202, ttl_seconds=60)
        state = mark_read(self.user_id, 101, ttl_seconds=60)
        self.assertEqual(state, {"dialogs": 1, "roomIds": [202], "counts": {"202": 1}})

    def test_touch_active_room_checks_conn_id(self):
        touch_active_room(self.user_id, "missing", ttl_seconds=60)

        set_active_room(self.user_id, 101, conn_id="conn_1", ttl_seconds=60)
        touch_active_room(self.user_id, "wrong", ttl_seconds=60)
        self.assertTrue(is_room_active(self.user_id, 101))

        touch_active_room(self.user_id, "conn_1", ttl_seconds=60)
        self.assertTrue(is_room_active(self.user_id, 101))

    def test_clear_active_room_respects_conn_id(self):
        set_active_room(self.user_id, 101, conn_id="conn_1", ttl_seconds=60)
        clear_active_room(self.user_id, conn_id="other_conn")
        self.assertTrue(is_room_active(self.user_id, 101))

        clear_active_room(self.user_id, conn_id="conn_1")
        self.assertFalse(is_room_active(self.user_id, 101))

    def test_clear_active_room_without_conn_id_deletes_key(self):
        set_active_room(self.user_id, 101, conn_id="conn_1", ttl_seconds=60)
        clear_active_room(self.user_id)
        self.assertFalse(is_room_active(self.user_id, 101))

    def test_is_room_active_returns_false_for_non_dict_value(self):
        cache.set(active_key(self.user_id), "bad", timeout=60)
        self.assertFalse(is_room_active(self.user_id, 101))

    def test_get_unread_state_returns_dialog_count(self):
        mark_unread(self.user_id, 101, ttl_seconds=60)
        mark_unread(self.user_id, 202, ttl_seconds=60)
        self.assertEqual(
            get_unread_state(self.user_id),
            {"dialogs": 2, "roomIds": [101, 202], "counts": {"101": 1, "202": 1}},
        )