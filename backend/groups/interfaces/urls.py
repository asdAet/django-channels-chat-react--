"""URL routing for the groups API."""

from django.urls import path

from . import views

app_name = "groups"

urlpatterns = [
    # Group CRUD
    path("", views.GroupCreateInteractiveView.as_view(), name="create"),
    path("public/", views.list_public_groups, name="list-public"),
    path("my/", views.list_my_groups, name="list-my"),
    path("<int:room_id>/", views.GroupDetailInteractiveView.as_view(), name="detail"),

    # Members
    path("<int:room_id>/join/", views.join_group, name="join"),
    path("<int:room_id>/leave/", views.leave_group, name="leave"),
    path("<int:room_id>/members/", views.list_members, name="members"),
    path("<int:room_id>/members/<int:user_id>/", views.kick_member, name="kick"),
    path("<int:room_id>/members/<int:user_id>/ban/", views.BanMemberInteractiveView.as_view(), name="ban"),
    path("<int:room_id>/members/<int:user_id>/unban/", views.unban_member, name="unban"),
    path("<int:room_id>/members/<int:user_id>/mute/", views.MuteMemberInteractiveView.as_view(), name="mute"),
    path("<int:room_id>/members/<int:user_id>/unmute/", views.unmute_member, name="unmute"),
    path("<int:room_id>/banned/", views.list_banned, name="banned"),

    # Invite links
    path("<int:room_id>/invites/", views.GroupInvitesInteractiveView.as_view(), name="invites"),
    path("<int:room_id>/invites/<str:code>/", views.revoke_invite, name="revoke-invite"),

    # Join requests
    path("<int:room_id>/requests/", views.list_join_requests, name="join-requests"),
    path("<int:room_id>/requests/<int:request_id>/approve/", views.approve_join_request, name="approve-request"),
    path("<int:room_id>/requests/<int:request_id>/reject/", views.reject_join_request, name="reject-request"),

    # Pinned messages
    path("<int:room_id>/pins/", views.GroupPinsInteractiveView.as_view(), name="pins"),
    path("<int:room_id>/pins/<int:message_id>/", views.unpin_message, name="unpin"),

    # Ownership
    path("<int:room_id>/transfer-ownership/", views.TransferOwnershipInteractiveView.as_view(), name="transfer-ownership"),
]

# Invite preview and join live at top level.
invite_urlpatterns = [
    path("invite/<str:code>/", views.invite_preview, name="invite-preview"),
    path("invite/<str:code>/join/", views.join_via_invite, name="invite-join"),
]

