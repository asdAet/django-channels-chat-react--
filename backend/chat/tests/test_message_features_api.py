"""API coverage for message payload/reactions/search/attachments features."""

from __future__ import annotations

from datetime import timedelta
import json
from urllib.parse import parse_qs, quote, urlparse
from contextlib import AbstractContextManager
from typing import Any, cast
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import OperationalError
from django.http import HttpResponse
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from chat import api, attachment_uploads
from chat.services import MessageForbiddenError
from chat.tests.media_utils import workspace_media_root
from chat.unread_push import build_room_unread_state
from messages.models import (
    Message,
    MessageAttachment,
    MessageAttachmentUpload,
    MessageReadReceipt,
    MessageReadState,
    Reaction,
)
from roles.models import Membership
from rooms.models import Room
from rooms.services import ensure_membership
from testsupport.files import require_stored_file_name
from testsupport.users import typed_user_model
from users.identity import ensure_user_identity_core, set_room_public_handle, set_user_public_handle

User = typed_user_model()


def _capture_on_commit_callbacks(test_case: TestCase, *, execute: bool) -> AbstractContextManager[list[object]]:
    callback_capture = cast(Any, test_case).captureOnCommitCallbacks
    return cast(AbstractContextManager[list[object]], callback_capture(execute=execute))


def _attachment_file_name(attachment: MessageAttachment) -> str:
    return require_stored_file_name(attachment.file, field_name="attachment.file")


def _attachment_thumbnail_name(attachment: MessageAttachment) -> str:
    return require_stored_file_name(attachment.thumbnail, field_name="attachment.thumbnail")


class ChatMessageFeatureApiTests(TestCase):
    def setUp(self):
        self.client: Any = Client()
        self.owner = User.objects.create_user(username="owner_feat", password="pass12345")
        self.peer = User.objects.create_user(username="peer_feat", password="pass12345")
        self.outsider = User.objects.create_user(username="outsider_feat", password="pass12345")
        set_user_public_handle(self.owner, self.owner.username)
        set_user_public_handle(self.peer, self.peer.username)
        set_user_public_handle(self.outsider, self.outsider.username)
        ensure_user_identity_core(self.owner)
        ensure_user_identity_core(self.peer)
        ensure_user_identity_core(self.outsider)

        self.direct_room = Room.objects.create(
            name="dm features",
            kind=Room.Kind.DIRECT,
            direct_pair_key=f"{self.owner.pk}:{self.peer.pk}",
            created_by=self.owner,
        )
        ensure_membership(self.direct_room, self.owner)
        ensure_membership(self.direct_room, self.peer)

    def _create_attachment_upload_session(
        self,
        room_id: int,
        *,
        filename: str,
        content_type: str,
        file_size: int,
        client: Any | None = None,
    ):
        active_client = client or self.client
        return active_client.post(
            f"/api/chat/{room_id}/attachments/uploads/",
            data=json.dumps(
                {
                    "originalFilename": filename,
                    "contentType": content_type,
                    "fileSize": file_size,
                }
            ),
            content_type="application/json",
        )

    def _upload_attachment_chunks(
        self,
        room_id: int,
        *,
        upload_id: str,
        content: bytes,
        chunk_size: int,
        client: Any | None = None,
    ) -> Any | None:
        active_client = client or self.client
        last_response: HttpResponse | None = None
        offset = 0
        while offset < len(content):
            chunk = content[offset : offset + chunk_size]
            last_response = active_client.put(
                f"/api/chat/{room_id}/attachments/uploads/{upload_id}/chunk/?offset={offset}",
                data=chunk,
                content_type="application/octet-stream",
            )
            offset += len(chunk)
        return last_response

    def _complete_attachment_upload(
        self,
        room_id: int,
        *,
        filename: str,
        content: bytes,
        content_type: str,
        client: Any | None = None,
    ) -> str:
        session_response = self._create_attachment_upload_session(
            room_id,
            filename=filename,
            content_type=content_type,
            file_size=len(content),
            client=client,
        )
        self.assertEqual(session_response.status_code, 201)
        session_payload = session_response.json()
        upload_id = session_payload["uploadId"]
        chunk_size = session_payload["chunkSize"]

        if content:
            chunk_response = self._upload_attachment_chunks(
                room_id,
                upload_id=upload_id,
                content=content,
                chunk_size=chunk_size,
                client=client,
            )
            assert chunk_response is not None
            self.assertEqual(chunk_response.status_code, 200)
            self.assertEqual(chunk_response.json()["receivedBytes"], len(content))
            self.assertEqual(chunk_response.json()["status"], "complete")

        return upload_id

    def _finalize_attachment_uploads(
        self,
        room_id: int,
        *,
        upload_ids: list[str],
        message_content: str = "",
        reply_to: int | None = None,
        client: Any | None = None,
    ):
        active_client = client or self.client
        return active_client.post(
            f"/api/chat/{room_id}/attachments/",
            data=json.dumps(
                {
                    "uploadIds": upload_ids,
                    "messageContent": message_content,
                    "replyTo": reply_to,
                }
            ),
            content_type="application/json",
        )

    def _upload_and_finalize_attachments(
        self,
        room_id: int,
        files: list[tuple[str, bytes, str]],
        *,
        message_content: str = "",
        reply_to: int | None = None,
        client: Any | None = None,
    ):
        upload_ids = [
            self._complete_attachment_upload(
                room_id,
                filename=filename,
                content=content,
                content_type=attachment_content_type,
                client=client,
            )
            for filename, content, attachment_content_type in files
        ]
        return self._finalize_attachment_uploads(
            room_id,
            upload_ids=upload_ids,
            message_content=message_content,
            reply_to=reply_to,
            client=client,
        )

    def test_reactions_allowed_in_direct_room(self):
        message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="reaction target",
        )
        self.client.force_login(self.owner)

        response = self.client.post(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
            data=json.dumps({"emoji": "\U0001F44D"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Reaction.objects.filter(
                message=message,
                user=self.owner,
                emoji="\U0001F44D",
            ).exists()
        )

    def test_global_search_respects_interaction_scope_for_all_sections(self):
        visible_group = Room.objects.create(
            name="scope visible group",
            kind=Room.Kind.GROUP,
            is_public=False,
            created_by=self.owner,
        )
        ensure_membership(visible_group, self.owner, role_name="Owner")
        set_room_public_handle(visible_group, "scope_visible_group")

        scope_friend = User.objects.create_user(username="scope_friend", password="pass12345")
        set_user_public_handle(scope_friend, scope_friend.username)
        ensure_membership(visible_group, scope_friend, role_name="Member")

        hidden_group = Room.objects.create(
            name="scope hidden group",
            kind=Room.Kind.GROUP,
            is_public=False,
            created_by=self.outsider,
        )
        set_room_public_handle(hidden_group, "scope_hidden_group")
        ensure_membership(hidden_group, self.outsider, role_name="Owner")

        hidden_scope_user = User.objects.create_user(username="scope_hidden", password="pass12345")
        set_user_public_handle(hidden_scope_user, hidden_scope_user.username)
        ensure_membership(hidden_group, hidden_scope_user, role_name="Member")

        visible_msg = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="scope visible message",
        )
        hidden_msg = Message.objects.create(
            username=self.outsider.username,
            user=self.outsider,
            room=hidden_group,
            message_content="scope hidden message",
        )

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=@scope")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertIn("users", payload)
        self.assertIn("groups", payload)
        self.assertIn("messages", payload)

        found_usernames = {item["username"] for item in payload["users"]}
        self.assertIn(scope_friend.username, found_usernames)
        self.assertNotIn(hidden_scope_user.username, found_usernames)

        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertIn(visible_group.pk, found_group_ids)
        self.assertNotIn(hidden_group.pk, found_group_ids)

        found_message_ids = {item["id"] for item in payload["messages"]}
        self.assertIn(visible_msg.pk, found_message_ids)
        self.assertNotIn(hidden_msg.pk, found_message_ids)
        self.assertFalse(any("hidden" in item["content"] for item in payload["messages"]))

    def test_global_search_for_superuser_is_not_limited_by_interaction_scope(self):
        hidden_group = Room.objects.create(
            name="super scope hidden group",
            kind=Room.Kind.GROUP,
            is_public=False,
            created_by=self.outsider,
        )
        set_room_public_handle(hidden_group, "superscopehiddengroup")
        ensure_membership(hidden_group, self.outsider, role_name="Owner")

        hidden_user = User.objects.create_user(
            username="super_scope_user",
            password="pass12345",
        )
        set_user_public_handle(hidden_user, "superscopeuser")
        ensure_user_identity_core(hidden_user)
        ensure_membership(hidden_group, hidden_user, role_name="Member")

        hidden_message = Message.objects.create(
            username=hidden_user.username,
            user=hidden_user,
            room=hidden_group,
            message_content="superscope hidden message",
        )

        superuser = User.objects.create_superuser(
            username="search_superuser_feat",
            email="search_superuser_feat@example.com",
            password="pass12345",
        )
        set_user_public_handle(superuser, "search_superuser_feat")
        ensure_user_identity_core(superuser)

        self.client.force_login(superuser)
        response = self.client.get("/api/chat/search/global/?q=@superscope")
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        found_usernames = {item["username"] for item in payload["users"]}
        self.assertIn("superscopeuser", found_usernames)

        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertIn(hidden_group.pk, found_group_ids)

        found_message_ids = {item["id"] for item in payload["messages"]}
        self.assertIn(hidden_message.pk, found_message_ids)

    def test_global_search_plain_text_includes_matching_handle_groups(self):
        visible_group = Room.objects.create(
            name="plain text scope group",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.owner,
        )
        set_room_public_handle(visible_group, "plain_scope_group")
        ensure_membership(visible_group, self.owner, role_name="Owner")

        visible_msg = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="plain_scope message",
        )

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=plain_scope")
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["users"], [])
        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertIn(visible_group.pk, found_group_ids)
        self.assertIn(visible_msg.pk, {item["id"] for item in payload["messages"]})

    def test_global_search_includes_any_matching_public_groups_without_interaction(self):
        public_group_one = Room.objects.create(
            name="Catalog Group One",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.outsider,
        )
        set_room_public_handle(public_group_one, "catalog_group_one")
        ensure_membership(public_group_one, self.outsider, role_name="Owner")

        public_group_two = Room.objects.create(
            name="Catalog Group Two",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.peer,
        )
        set_room_public_handle(public_group_two, "catalog_group_two")
        ensure_membership(public_group_two, self.peer, role_name="Owner")

        private_group = Room.objects.create(
            name="Catalog Private Group",
            kind=Room.Kind.GROUP,
            is_public=False,
            created_by=self.outsider,
        )
        set_room_public_handle(private_group, "catalog_private_group")
        ensure_membership(private_group, self.outsider, role_name="Owner")

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=@catalog")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertIn(public_group_one.pk, found_group_ids)
        self.assertIn(public_group_two.pk, found_group_ids)
        self.assertNotIn(private_group.pk, found_group_ids)

    def test_global_search_handle_excludes_public_group_without_username(self):
        public_group = Room.objects.create(
            name="Catalog Group No Handle",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.outsider,
        )
        ensure_membership(public_group, self.outsider, role_name="Owner")

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=@catalog")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertNotIn(public_group.pk, found_group_ids)

    def test_global_search_supports_handle_query_for_group_username(self):
        group_username = "public_handle_group"
        public_group = Room.objects.create(
            name="Another public group",
            kind=Room.Kind.GROUP,
            is_public=True,
            created_by=self.outsider,
        )
        set_room_public_handle(public_group, group_username)
        ensure_membership(public_group, self.outsider, role_name="Owner")

        self.client.force_login(self.owner)
        response = self.client.get(f"/api/chat/search/global/?q=@{group_username}")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        found_group_ids = {item["roomId"] for item in payload["groups"]}
        self.assertIn(public_group.pk, found_group_ids)

    def test_global_search_supports_handle_query_for_updated_username(self):
        set_user_public_handle(self.peer, "peerfeatureupdated")

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=@peerfeatureupdated")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        found_usernames = {item["username"] for item in payload["users"]}
        self.assertIn("peerfeatureupdated", found_usernames)

    def test_global_search_plain_text_does_not_search_users_by_handle(self):
        set_user_public_handle(self.peer, "peerfeatureupdated")

        self.client.force_login(self.owner)
        response = self.client.get("/api/chat/search/global/?q=peerfeatureupdated")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["users"], [])

    def test_attachment_upload_accepts_reply_to_and_get_lists_items(self):
        reply_target = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="reply target",
        )
        self.client.force_login(self.owner)

        post_response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("note.txt", b"hello attachment", "text/plain")],
            message_content="file message",
            reply_to=reply_target.pk,
        )
        self.assertEqual(post_response.status_code, 201)
        created_id = post_response.json()["id"]
        created_message = Message.objects.get(pk=created_id)
        self.assertEqual(created_message.reply_to_id, reply_target.pk)

        get_response = self.client.get(f"/api/chat/{self.direct_room.pk}/attachments/")
        self.assertEqual(get_response.status_code, 200)
        items = get_response.json()["items"]
        self.assertTrue(any(item["messageId"] == created_id for item in items))

    def test_attachment_upload_in_public_room_creates_membership_and_media_is_readable(self):
        public_room = Room.objects.create(
            name="public features attachments",
            kind=Room.Kind.PUBLIC,
            created_by=self.owner,
        )
        self.assertFalse(
            Membership.objects.filter(room=public_room, user=self.outsider, is_banned=False).exists()
        )

        self.client.force_login(self.outsider)
        post_response = self._upload_and_finalize_attachments(
            public_room.pk,
            [("public-note.txt", b"public room attachment", "text/plain")],
        )
        self.assertEqual(post_response.status_code, 201)
        self.assertTrue(
            Membership.objects.filter(room=public_room, user=self.outsider, is_banned=False).exists()
        )

        attachment_url = post_response.json()["attachments"][0]["url"]
        parsed = urlparse(attachment_url)
        media_response = self.client.get(f"{parsed.path}?{parsed.query}")
        self.assertEqual(media_response.status_code, 200)
        media_response.close()

    def test_attachment_urls_are_room_scoped_without_signed_query(self):
        self.client.force_login(self.owner)

        post_response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("scoped.txt", b"room scoped attachment", "text/plain")],
        )
        self.assertEqual(post_response.status_code, 201)
        attachment_payload = post_response.json()["attachments"][0]

        attachment_url = attachment_payload["url"]
        self.assertIsNotNone(attachment_url)
        parsed_upload = urlparse(attachment_url)
        query_upload = parse_qs(parsed_upload.query)
        self.assertEqual(query_upload.get("roomId"), [str(self.direct_room.pk)])
        self.assertNotIn("exp", query_upload)
        self.assertNotIn("sig", query_upload)

        list_response = self.client.get(f"/api/chat/{self.direct_room.pk}/attachments/")
        self.assertEqual(list_response.status_code, 200)
        item = next(
            current
            for current in list_response.json()["items"]
            if current["id"] == attachment_payload["id"]
        )
        parsed_list = urlparse(item["url"])
        query_list = parse_qs(parsed_list.query)
        self.assertEqual(query_list.get("roomId"), [str(self.direct_room.pk)])
        self.assertNotIn("exp", query_list)
        self.assertNotIn("sig", query_list)

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["text/plain"],
    )
    def test_attachment_upload_session_rejects_unsupported_content_type_with_code(self):
        self.client.force_login(self.owner)
        post_response = self._create_attachment_upload_session(
            self.direct_room.pk,
            filename="archive.bin",
            content_type="application/x-custom-binary",
            file_size=4,
        )

        self.assertEqual(post_response.status_code, 400)
        payload = post_response.json()
        self.assertEqual(payload["code"], "unsupported_type")
        self.assertIn("allowedTypes", payload["details"])

    def test_attachment_upload_chunk_reports_progress_and_rejects_offset_mismatch(self):
        self.client.force_login(self.owner)

        session_response = self._create_attachment_upload_session(
            self.direct_room.pk,
            filename="chunked.bin",
            content_type="application/octet-stream",
            file_size=8,
        )
        self.assertEqual(session_response.status_code, 201)
        upload_id = session_response.json()["uploadId"]

        first_chunk = self.client.put(
            f"/api/chat/{self.direct_room.pk}/attachments/uploads/{upload_id}/chunk/?offset=0",
            data=b"1234",
            content_type="application/octet-stream",
        )
        self.assertEqual(first_chunk.status_code, 200)
        self.assertEqual(first_chunk.json()["receivedBytes"], 4)
        self.assertEqual(first_chunk.json()["status"], "uploading")

        wrong_offset = self.client.put(
            f"/api/chat/{self.direct_room.pk}/attachments/uploads/{upload_id}/chunk/?offset=1",
            data=b"5678",
            content_type="application/octet-stream",
        )
        self.assertEqual(wrong_offset.status_code, 409)
        self.assertEqual(wrong_offset.json()["code"], "offset_mismatch")

    @override_settings(
        CHAT_ATTACHMENT_CHUNK_MIN_SIZE_KB=1,
        CHAT_ATTACHMENT_CHUNK_MAX_SIZE_MB=1,
        CHAT_ATTACHMENT_TARGET_CHUNKS=1024,
    )
    def test_attachment_upload_chunk_rejects_payload_larger_than_session_chunk_size(self):
        self.client.force_login(self.owner)

        session_response = self._create_attachment_upload_session(
            self.direct_room.pk,
            filename="oversized.bin",
            content_type="application/octet-stream",
            file_size=2048,
        )
        self.assertEqual(session_response.status_code, 201)
        payload = session_response.json()
        self.assertEqual(payload["chunkSize"], 1024)

        oversized_chunk = self.client.put(
            f"/api/chat/{self.direct_room.pk}/attachments/uploads/{payload['uploadId']}/chunk/?offset=0",
            data=b"x" * 1500,
            content_type="application/octet-stream",
        )

        self.assertEqual(oversized_chunk.status_code, 413)
        self.assertEqual(
            oversized_chunk.json()["code"],
            "chunk_exceeds_session_limit",
        )

    def test_attachment_upload_detail_delete_aborts_session(self):
        self.client.force_login(self.owner)

        session_response = self._create_attachment_upload_session(
            self.direct_room.pk,
            filename="abort.bin",
            content_type="application/octet-stream",
            file_size=3,
        )
        self.assertEqual(session_response.status_code, 201)
        upload_id = session_response.json()["uploadId"]

        delete_response = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/attachments/uploads/{upload_id}/"
        )
        self.assertEqual(delete_response.status_code, 204)

        detail_response = self.client.get(
            f"/api/chat/{self.direct_room.pk}/attachments/uploads/{upload_id}/"
        )
        self.assertEqual(detail_response.status_code, 404)
        self.assertEqual(detail_response.json()["code"], "upload_not_found")

    def test_attachment_upload_finalize_reuses_temp_blob_without_second_read_copy(self):
        self.client.force_login(self.owner)

        with workspace_media_root():
            upload_id = self._complete_attachment_upload(
                self.direct_room.pk,
                filename="fast-path.txt",
                content=b"fast finalize path",
                content_type="text/plain",
            )
            upload = MessageAttachmentUpload.objects.get(pk=upload_id)
            temp_storage_name = upload.storage_name

            with patch.object(
                attachment_uploads.default_storage,
                "open",
                wraps=attachment_uploads.default_storage.open,
            ) as storage_open:
                with _capture_on_commit_callbacks(self, execute=True):
                    response = self._finalize_attachment_uploads(
                        self.direct_room.pk,
                        upload_ids=[upload_id],
                    )

            self.assertEqual(response.status_code, 201)
            self.assertFalse(
                any(
                    call.args
                    and call.args[0] == temp_storage_name
                    and (
                        (call.args[1] if len(call.args) > 1 else call.kwargs.get("mode", ""))
                        == "rb"
                    )
                    for call in storage_open.mock_calls
                )
            )
            self.assertFalse(
                MessageAttachmentUpload.objects.filter(pk=upload_id).exists()
            )

    def test_attachment_upload_returns_code_when_upload_ids_missing(self):
        self.client.force_login(self.owner)
        response = self._finalize_attachment_uploads(
            self.direct_room.pk,
            upload_ids=[],
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "no_uploads")

    def test_attachment_upload_returns_code_for_invalid_upload_id(self):
        self.client.force_login(self.owner)
        response = self._finalize_attachment_uploads(
            self.direct_room.pk,
            upload_ids=["not-a-uuid"],
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "invalid_upload_id")

    @override_settings(CHAT_ATTACHMENT_MAX_PER_MESSAGE=1)
    def test_attachment_upload_returns_code_when_too_many_files(self):
        self.client.force_login(self.owner)
        upload_ids = [
            self._complete_attachment_upload(
                self.direct_room.pk,
                filename="one.txt",
                content=b"1",
                content_type="text/plain",
            ),
            self._complete_attachment_upload(
                self.direct_room.pk,
                filename="two.txt",
                content=b"2",
                content_type="text/plain",
            ),
        ]
        response = self._finalize_attachment_uploads(
            self.direct_room.pk,
            upload_ids=upload_ids,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "too_many_files")

    @override_settings(CHAT_ATTACHMENT_MAX_PER_MESSAGE=1)
    def test_attachment_upload_allows_too_many_files_for_superuser(self):
        superuser = User.objects.create_superuser(
            username="attach_count_superuser",
            email="attach_count_superuser@example.com",
            password="pass12345",
        )
        set_user_public_handle(superuser, "attach_count_superuser")
        ensure_user_identity_core(superuser)

        self.client.force_login(superuser)
        upload_ids = [
            self._complete_attachment_upload(
                self.direct_room.pk,
                filename="one.txt",
                content=b"1",
                content_type="text/plain",
            ),
            self._complete_attachment_upload(
                self.direct_room.pk,
                filename="two.txt",
                content=b"2",
                content_type="text/plain",
            ),
        ]
        response = self._finalize_attachment_uploads(
            self.direct_room.pk,
            upload_ids=upload_ids,
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(len(payload.get("attachments", [])), 2)

    def test_attachment_upload_returns_code_for_invalid_reply(self):
        self.client.force_login(self.owner)
        upload_id = self._complete_attachment_upload(
            self.direct_room.pk,
            filename="reply.txt",
            content=b"file",
            content_type="text/plain",
        )
        response = self._finalize_attachment_uploads(
            self.direct_room.pk,
            upload_ids=[upload_id],
            reply_to=999999,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "invalid_reply_to")

    @override_settings(CHAT_ATTACHMENT_MAX_SIZE_MB=1)
    def test_attachment_upload_session_returns_code_when_file_too_large(self):
        self.client.force_login(self.owner)
        response = self._create_attachment_upload_session(
            self.direct_room.pk,
            filename="large.txt",
            content_type="text/plain",
            file_size=2 * 1024 * 1024,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "file_too_large")

    @override_settings(CHAT_ATTACHMENT_MAX_SIZE_MB=1)
    def test_attachment_upload_allows_oversized_file_for_superuser(self):
        superuser = User.objects.create_superuser(
            username="attach_size_superuser",
            email="attach_size_superuser@example.com",
            password="pass12345",
        )
        set_user_public_handle(superuser, "attach_size_superuser")
        ensure_user_identity_core(superuser)

        self.client.force_login(superuser)
        large_payload = b"x" * (2 * 1024 * 1024)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("large-superuser.txt", large_payload, "text/plain")],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(len(payload.get("attachments", [])), 1)
        self.assertEqual(payload["attachments"][0]["originalFilename"], "large-superuser.txt")

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["audio/mpeg"],
    )
    def test_attachment_upload_normalizes_audio_mp3_alias(self):
        self.client.force_login(self.owner)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("voice.mp3", b"ID3\x03\x00\x00\x00\x00\x00\x00", "audio/mp3")],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["attachments"][0]["contentType"], "audio/mpeg")

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["image/svg+xml"],
    )
    def test_attachment_upload_normalizes_svg_content_type_from_generic_mime(self):
        self.client.force_login(self.owner)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [
                (
                    "pizza.svg",
                    b"<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'></svg>",
                    "text/plain",
                )
            ],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["attachments"][0]["contentType"], "image/svg+xml")

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["application/zip"],
    )
    def test_attachment_upload_normalizes_zip_alias_from_windows_mime(self):
        self.client.force_login(self.owner)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("mods.zip", b"PK\x03\x04", "application/x-zip-compressed")],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["attachments"][0]["contentType"], "application/zip")

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["application/vnd.rar"],
    )
    def test_attachment_upload_guesses_rar_from_extension_for_x_compressed(self):
        self.client.force_login(self.owner)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("modpack.rar", b"Rar!\x1a\x07\x00", "application/x-compressed")],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["attachments"][0]["contentType"], "application/vnd.rar")

    @override_settings(
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["application/java-archive"],
    )
    def test_attachment_upload_guesses_jar_from_extension_for_octet_stream(self):
        self.client.force_login(self.owner)
        response = self._upload_and_finalize_attachments(
            self.direct_room.pk,
            [("cannedgoods-1.20.1-1.jar", b"PK\x03\x04", "application/octet-stream")],
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(
            payload["attachments"][0]["contentType"],
            "application/java-archive",
        )

    def test_mark_read_is_monotonic_and_persisted_in_room_details(self):
        first_message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="first unread",
        )
        second_message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="second unread",
        )
        self.client.force_login(self.owner)

        first_read_response = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data=json.dumps({"lastReadMessageId": second_message.pk}),
            content_type="application/json",
        )
        self.assertEqual(first_read_response.status_code, 200)
        self.assertEqual(first_read_response.json()["lastReadMessageId"], second_message.pk)
        self.assertIsNotNone(first_read_response.json()["lastReadAt"])

        backward_response = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data=json.dumps({"lastReadMessageId": first_message.pk}),
            content_type="application/json",
        )
        self.assertEqual(backward_response.status_code, 200)
        self.assertEqual(backward_response.json()["lastReadMessageId"], second_message.pk)

        details_response = self.client.get(f"/api/chat/{self.direct_room.pk}/")
        self.assertEqual(details_response.status_code, 200)
        self.assertEqual(details_response.json()["lastReadMessageId"], second_message.pk)

    def test_mark_read_accepts_form_payload_for_keepalive_flush(self):
        message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="form-data mark read",
        )
        self.client.force_login(self.owner)

        response = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data={"lastReadMessageId": str(message.pk)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["lastReadMessageId"], message.pk)
        self.assertIsNotNone(response.json()["lastReadAt"])

    def test_message_detail_patch_validates_content_type_and_empty_value(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="initial",
        )
        self.client.force_login(self.owner)

        not_string = self.client.patch(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/",
            data=json.dumps({"content": 123}),
            content_type="application/json",
        )
        self.assertEqual(not_string.status_code, 400)

        empty = self.client.patch(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/",
            data=json.dumps({"content": "   "}),
            content_type="application/json",
        )
        self.assertEqual(empty.status_code, 400)

    def test_message_detail_patch_and_delete_cover_success_and_not_found(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="initial",
        )
        self.client.force_login(self.owner)

        patch_response = self.client.patch(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/",
            data=json.dumps({"content": "updated"}),
            content_type="application/json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["content"], "updated")

        not_found = self.client.patch(
            f"/api/chat/{self.direct_room.pk}/messages/999999/",
            data=json.dumps({"content": "x"}),
            content_type="application/json",
        )
        self.assertEqual(not_found.status_code, 404)

        delete_response = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/"
        )
        self.assertEqual(delete_response.status_code, 204)
        message.refresh_from_db()
        self.assertTrue(message.is_deleted)

    def test_message_detail_delete_returns_forbidden_for_non_author(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="cant delete by peer",
        )
        self.client.force_login(self.peer)

        response = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/"
        )
        self.assertEqual(response.status_code, 403)

    def test_message_detail_allows_superuser_edit_and_delete_outside_membership(self):
        private_room = Room.objects.create(
            name="private superuser access",
            kind=Room.Kind.PRIVATE,
            created_by=self.outsider,
        )
        ensure_membership(private_room, self.outsider)
        message = Message.objects.create(
            username=self.outsider.username,
            user=self.outsider,
            room=private_room,
            message_content="hidden message",
        )
        superuser = User.objects.create_superuser(
            username="chat_superuser_feat",
            email="chat_superuser_feat@example.com",
            password="pass12345",
        )
        set_user_public_handle(superuser, "chat_superuser_feat")
        ensure_user_identity_core(superuser)
        self.client.force_login(superuser)

        patch_response = self.client.patch(
            f"/api/chat/{private_room.pk}/messages/{message.pk}/",
            data=json.dumps({"content": "edited by superuser"}),
            content_type="application/json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["content"], "edited by superuser")

        delete_response = self.client.delete(
            f"/api/chat/{private_room.pk}/messages/{message.pk}/"
        )
        self.assertEqual(delete_response.status_code, 204)
        message.refresh_from_db()
        self.assertTrue(message.is_deleted)

    def test_message_detail_delete_removes_attachment_files_when_enabled(self):
        self.client.force_login(self.owner)
        with workspace_media_root(), override_settings(
            CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE=True,
        ):
            message = Message.objects.create(
                username=self.owner.username,
                user=self.owner,
                room=self.direct_room,
                message_content="with attachments",
            )
            attachment = MessageAttachment.objects.create(
                message=message,
                file=SimpleUploadedFile("doc.txt", b"file", content_type="text/plain"),
                original_filename="doc.txt",
                content_type="text/plain",
                file_size=4,
                thumbnail=SimpleUploadedFile("thumb.txt", b"thumb", content_type="text/plain"),
            )
            file_storage = attachment.file.storage
            thumb_storage = attachment.thumbnail.storage
            file_name = _attachment_file_name(attachment)
            thumb_name = _attachment_thumbnail_name(attachment)

            self.assertTrue(file_storage.exists(file_name))
            self.assertTrue(thumb_storage.exists(thumb_name))

            response = self.client.delete(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/"
            )

            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, b"")
            message.refresh_from_db()
            self.assertTrue(message.is_deleted)
            self.assertTrue(MessageAttachment.objects.filter(pk=attachment.pk).exists())
            self.assertFalse(file_storage.exists(file_name))
            self.assertFalse(thumb_storage.exists(thumb_name))

    def test_message_reactions_handles_forbidden_and_remove_flow(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="reactions",
        )
        self.client.force_login(self.peer)

        with patch("chat.api.add_reaction", side_effect=MessageForbiddenError("forbidden")):
            forbidden = self.client.post(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
                data=json.dumps({"emoji": "👍"}),
                content_type="application/json",
            )
        self.assertEqual(forbidden.status_code, 403)

        added = self.client.post(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
            data=json.dumps({"emoji": "👍"}),
            content_type="application/json",
        )
        self.assertEqual(added.status_code, 200)
        self.assertTrue(
            Reaction.objects.filter(message=message, user=self.peer, emoji="👍").exists()
        )

        removed = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/%F0%9F%91%8D/"
        )
        self.assertEqual(removed.status_code, 204)
        self.assertFalse(
            Reaction.objects.filter(message=message, user=self.peer, emoji="👍").exists()
        )

    def test_message_reactions_accept_custom_emoji_token(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="custom reaction",
        )
        custom_emoji = "[[ce:animated%2F014_5371073319107827779.tgs]]"
        self.assertGreater(len(custom_emoji), 32)
        self.client.force_login(self.peer)

        added = self.client.post(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
            data=json.dumps({"emoji": custom_emoji}),
            content_type="application/json",
        )

        self.assertEqual(added.status_code, 200)
        self.assertEqual(added.json()["emoji"], custom_emoji)
        self.assertTrue(
            Reaction.objects.filter(
                message=message,
                user=self.peer,
                emoji=custom_emoji,
            ).exists()
        )

        removed = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/"
            f"{quote(custom_emoji, safe='')}/"
        )

        self.assertEqual(removed.status_code, 204)
        self.assertFalse(
            Reaction.objects.filter(
                message=message,
                user=self.peer,
                emoji=custom_emoji,
            ).exists()
        )

    def test_message_reactions_are_idempotent_for_the_same_emoji(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="reaction idempotency",
        )
        self.client.force_login(self.peer)

        with patch("chat.api._broadcast_to_room") as broadcast_mock:
            first_add = self.client.post(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
                data=json.dumps({"emoji": "👍"}),
                content_type="application/json",
            )
            second_add = self.client.post(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
                data=json.dumps({"emoji": "👍"}),
                content_type="application/json",
            )
            first_remove = self.client.delete(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/%F0%9F%91%8D/"
            )
            second_remove = self.client.delete(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/%F0%9F%91%8D/"
            )

        self.assertEqual(first_add.status_code, 200)
        self.assertEqual(second_add.status_code, 200)
        self.assertEqual(first_remove.status_code, 204)
        self.assertEqual(second_remove.status_code, 204)
        self.assertEqual(
            Reaction.objects.filter(message=message, user=self.peer, emoji="👍").count(),
            0,
        )
        self.assertEqual(broadcast_mock.call_count, 2)
        self.assertEqual(broadcast_mock.call_args_list[0].args[1]["type"], "chat_reaction_add")
        self.assertEqual(broadcast_mock.call_args_list[1].args[1]["type"], "chat_reaction_remove")

    def test_message_reactions_allow_multiple_distinct_emojis_for_same_user(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="multiple reactions",
        )
        self.client.force_login(self.peer)

        first_add = self.client.post(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
            data=json.dumps({"emoji": "👍"}),
            content_type="application/json",
        )
        second_add = self.client.post(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/",
            data=json.dumps({"emoji": "😂"}),
            content_type="application/json",
        )
        remove_first = self.client.delete(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/reactions/%F0%9F%91%8D/"
        )

        self.assertEqual(first_add.status_code, 200)
        self.assertEqual(second_add.status_code, 200)
        self.assertEqual(remove_first.status_code, 204)
        self.assertFalse(
            Reaction.objects.filter(message=message, user=self.peer, emoji="👍").exists()
        )
        self.assertTrue(
            Reaction.objects.filter(message=message, user=self.peer, emoji="😂").exists()
        )
        self.assertEqual(Reaction.objects.filter(message=message, user=self.peer).count(), 1)

    def test_search_messages_handles_validation_and_pagination(self):
        first = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="needle first",
        )
        second = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="needle second",
        )
        Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="other",
        )

        self.client.force_login(self.owner)
        short = self.client.get(f"/api/chat/{self.direct_room.pk}/messages/search/?q=x")
        self.assertEqual(short.status_code, 400)

        page = self.client.get(
            f"/api/chat/{self.direct_room.pk}/messages/search/?q=needle&limit=1&before=bad"
        )
        self.assertEqual(page.status_code, 200)
        payload = page.json()
        self.assertEqual(payload["pagination"]["limit"], 1)
        self.assertTrue(payload["pagination"]["hasMore"])
        self.assertEqual(len(payload["results"]), 1)

        before_filtered = self.client.get(
            f"/api/chat/{self.direct_room.pk}/messages/search/?q=needle&before={second.pk}"
        )
        self.assertEqual(before_filtered.status_code, 200)
        ids = {item["id"] for item in before_filtered.json()["results"]}
        self.assertIn(first.pk, ids)
        self.assertNotIn(second.pk, ids)

    def test_mark_read_validation_public_room_and_ws_unread_state(self):
        message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="for unread",
        )
        self.client.force_login(self.owner)

        bool_payload = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data=json.dumps({"lastReadMessageId": True}),
            content_type="application/json",
        )
        self.assertEqual(bool_payload.status_code, 400)

        negative_payload = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data=json.dumps({"lastReadMessageId": -1}),
            content_type="application/json",
        )
        self.assertEqual(negative_payload.status_code, 400)

        unread_before = build_room_unread_state(self.owner)
        self.assertIn(str(self.direct_room.pk), unread_before["counts"])

        with patch("chat.api.broadcast_room_unread_state_for_user") as push_unread:
            read_ok = self.client.post(
                f"/api/chat/{self.direct_room.pk}/read/",
                data=json.dumps({"lastReadMessageId": message.pk}),
                content_type="application/json",
            )
        self.assertEqual(read_ok.status_code, 200)
        push_unread.assert_called_once_with(self.owner)

        unread_after = build_room_unread_state(self.owner)
        self.assertNotIn(str(self.direct_room.pk), unread_after["counts"])

        public_room = api._public_room()
        public_message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=public_room,
            message_content="public unread",
        )
        unread_public_before = build_room_unread_state(self.owner)
        self.assertNotIn(str(public_room.pk), unread_public_before["counts"])

        public_details = self.client.get(f"/api/chat/{public_room.pk}/")
        self.assertEqual(public_details.status_code, 200)
        self.assertEqual(public_details.json()["lastReadMessageId"], public_message.pk)
        self.assertTrue(
            MessageReadState.objects.filter(
                user=self.owner,
                room=public_room,
                last_read_message_id=public_message.pk,
            ).exists()
        )

        unread_public_after_first_visit = build_room_unread_state(self.owner)
        self.assertNotIn(str(public_room.pk), unread_public_after_first_visit["counts"])

        later_public_message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=public_room,
            message_content="public unread later",
        )

        unread_public_after_new_message = build_room_unread_state(self.owner)
        self.assertEqual(unread_public_after_new_message["counts"].get(str(public_room.pk)), 1)

        with patch("chat.api.broadcast_room_unread_state_for_user") as push_unread:
            public_short = self.client.post(
                f"/api/chat/{public_room.pk}/read/",
                data=json.dumps({"lastReadMessageId": later_public_message.pk}),
                content_type="application/json",
            )
        self.assertEqual(public_short.status_code, 200)
        push_unread.assert_called_once_with(self.owner)
        self.assertEqual(public_short.json()["lastReadMessageId"], later_public_message.pk)
        self.assertIsNotNone(public_short.json()["lastReadAt"])
        self.assertTrue(
            MessageReadState.objects.filter(
                user=self.owner,
                room=public_room,
                last_read_message_id=later_public_message.pk,
            ).exists()
        )

        unread_public_after = build_room_unread_state(self.owner)
        self.assertNotIn(str(public_room.pk), unread_public_after["counts"])

    def test_unread_counts_rest_endpoint_is_removed(self):
        self.client.force_login(self.owner)

        response = self.client.get("/api/chat/unread/")

        self.assertEqual(response.status_code, 404)

    def test_message_readers_endpoint_returns_direct_read_at_for_author(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="direct own message",
        )
        self.client.force_login(self.peer)
        mark_read_response = self.client.post(
            f"/api/chat/{self.direct_room.pk}/read/",
            data=json.dumps({"lastReadMessageId": message.pk}),
            content_type="application/json",
        )
        self.assertEqual(mark_read_response.status_code, 200)

        self.client.force_login(self.owner)
        response = self.client.get(
            f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/readers/"
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["roomKind"], "direct")
        self.assertEqual(payload["messageId"], message.pk)
        self.assertEqual(payload["readers"], [])
        self.assertIsNotNone(payload["readAt"])

    def test_message_readers_endpoint_returns_group_readers_for_author_only(self):
        group_room = Room.objects.create(
            name="Readers group",
            kind=Room.Kind.GROUP,
            is_public=False,
            created_by=self.owner,
        )
        ensure_membership(group_room, self.owner, role_name="Owner")
        ensure_membership(group_room, self.peer, role_name="Member")
        ensure_membership(group_room, self.outsider, role_name="Member")
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=group_room,
            message_content="group own message",
        )

        self.client.force_login(self.peer)
        self.assertEqual(
            self.client.post(
                f"/api/chat/{group_room.pk}/read/",
                data=json.dumps({"lastReadMessageId": message.pk}),
                content_type="application/json",
            ).status_code,
            200,
        )

        self.client.force_login(self.outsider)
        self.assertEqual(
            self.client.post(
                f"/api/chat/{group_room.pk}/read/",
                data=json.dumps({"lastReadMessageId": message.pk}),
                content_type="application/json",
            ).status_code,
            200,
        )

        older = timezone.now() - timedelta(minutes=2)
        newer = timezone.now() - timedelta(minutes=1)
        MessageReadReceipt.objects.filter(message=message, user=self.peer).update(read_at=older)
        MessageReadReceipt.objects.filter(message=message, user=self.outsider).update(read_at=newer)

        self.client.force_login(self.owner)
        response = self.client.get(
            f"/api/chat/{group_room.pk}/messages/{message.pk}/readers/"
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["roomKind"], "group")
        self.assertEqual(payload["messageId"], message.pk)
        self.assertEqual([item["userId"] for item in payload["readers"]], [self.outsider.pk, self.peer.pk])
        self.assertIn("profileImage", payload["readers"][0])
        self.assertIn("avatarCrop", payload["readers"][0])
        self.assertIsNone(payload["readAt"])

        self.client.force_login(self.peer)
        forbidden = self.client.get(
            f"/api/chat/{group_room.pk}/messages/{message.pk}/readers/"
        )
        self.assertEqual(forbidden.status_code, 403)

    def test_mark_read_endpoint_survives_missing_receipt_table(self):
        message = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.direct_room,
            message_content="survive missing receipts",
        )
        self.client.force_login(self.owner)

        with patch(
            "chat.services.MessageReadReceipt.objects.bulk_create",
            side_effect=OperationalError("no such table: messages_read_receipt"),
        ):
            response = self.client.post(
                f"/api/chat/{self.direct_room.pk}/read/",
                data=json.dumps({"lastReadMessageId": message.pk}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["lastReadMessageId"], message.pk)

    def test_message_readers_endpoint_survives_missing_receipt_table(self):
        message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.direct_room,
            message_content="reader fallback",
        )
        self.client.force_login(self.owner)

        with patch(
            "chat.services.MessageReadReceipt.objects.filter",
            side_effect=OperationalError("no such table: messages_read_receipt"),
        ):
            response = self.client.get(
                f"/api/chat/{self.direct_room.pk}/messages/{message.pk}/readers/"
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["roomKind"], "direct")
        self.assertEqual(response.json()["messageId"], message.pk)
        self.assertEqual(response.json()["readAt"], None)
        self.assertEqual(response.json()["readers"], [])

