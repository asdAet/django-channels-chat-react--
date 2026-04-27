"""Contains chat API routing."""

from django.urls import include, path

from . import api

urlpatterns = [
    path("resolve/", api.chat_resolve, name="api-chat-resolve"),
    path("inbox/", api.direct_chats, name="api-chat-inbox"),
    path("search/global/", api.global_search, name="api-global-search"),
    path("<int:room_id>/", include("roles.interfaces.urls")),
    path("<int:room_id>/messages/search/", api.search_messages, name="api-search-messages"),
    path("<int:room_id>/messages/<int:message_id>/reactions/<str:emoji>/", api.message_reaction_remove, name="api-message-reaction-remove"),
    path("<int:room_id>/messages/<int:message_id>/reactions/", api.message_reactions, name="api-message-reactions"),
    path("<int:room_id>/messages/<int:message_id>/readers/", api.message_readers, name="api-message-readers"),
    path("<int:room_id>/messages/<int:message_id>/", api.message_detail, name="api-message-detail"),
    path("<int:room_id>/messages/", api.room_messages, name="api-room-messages"),
    path("<int:room_id>/attachments/uploads/", api.attachment_uploads_collection, name="api-attachment-upload-sessions"),
    path("<int:room_id>/attachments/uploads/<uuid:upload_id>/", api.attachment_upload_detail, name="api-attachment-upload-detail"),
    path("<int:room_id>/attachments/uploads/<uuid:upload_id>/chunk/", api.attachment_upload_chunk, name="api-attachment-upload-chunk"),
    path("<int:room_id>/attachments/", api.upload_attachments, name="api-upload-attachments"),
    path("<int:room_id>/read/", api.mark_read_view, name="api-mark-read"),
    path("<int:room_id>/", api.room_details, name="api-room-details"),
]
