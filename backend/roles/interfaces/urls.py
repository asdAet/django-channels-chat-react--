"""URL routes for room-scoped role management API."""

from django.urls import path

from roles.interfaces import views

urlpatterns = [
    path("roles/", views.RoomRolesApiView.as_view(), name="api-room-roles"),
    path("roles/<int:role_id>/", views.RoomRoleDetailApiView.as_view(), name="api-room-role-detail"),
    path(
        "members/<int:user_id>/roles/",
        views.RoomMemberRolesApiView.as_view(),
        name="api-room-member-roles",
    ),
    path("overrides/", views.RoomOverridesApiView.as_view(), name="api-room-overrides"),
    path(
        "overrides/<int:override_id>/",
        views.RoomOverrideDetailApiView.as_view(),
        name="api-room-override-detail",
    ),
    path("permissions/me/", views.RoomMyPermissionsApiView.as_view(), name="api-room-permissions-me"),
]

