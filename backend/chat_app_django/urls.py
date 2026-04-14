"""URL routing for chat_app_django."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import NoReverseMatch, include, path, reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import health
from . import metrics as app_metrics
from . import meta_api
from groups.interfaces.urls import invite_urlpatterns as _group_invite_urls
from users import api as users_api


def _absolute(request, raw_path: str) -> str:
    """Вспомогательная функция `_absolute` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        raw_path: Параметр raw path, используемый в логике функции.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return request.build_absolute_uri(raw_path)


def _link(request, name: str, kwargs: dict | None = None) -> str | None:
    """Выполняет вспомогательную обработку для link.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        name: Человекочитаемое имя объекта или параметра.
        kwargs: Дополнительные именованные аргументы вызова.
    
    Returns:
        Объект типа str | None, полученный при выполнении операции.
    """
    try:
        return request.build_absolute_uri(reverse(name, kwargs=kwargs))
    except NoReverseMatch:
        return None


def _first_link(request, names: list[str]) -> str | None:
    """Вспомогательная функция `_first_link` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        names: Параметр names, используемый в логике функции.
    
    Returns:
        Объект типа str | None, сформированный в ходе выполнения.
    """
    for name in names:
        link = _link(request, name)
        if link:
            return link
    return None


@api_view(["GET"])
@permission_classes([AllowAny])
def api_index(request):
    """Вспомогательная функция `api_index` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    endpoints = {
        "health": {
            "live": _link(request, "health-live"),
            "ready": _link(request, "health-ready"),
        },
        "meta": {
            "clientConfig": _link(request, "api-client-config"),
            "visit": _link(request, "api-site-visit"),
        },
        "auth": {
            "csrf": _link(request, "api-csrf-token"),
            "session": _link(request, "api-session"),
            "presenceSession": _link(request, "api-presence-session"),
            "passwordRules": _link(request, "api-password-rules"),
            "login": _link(request, "api-login"),
            "logout": _link(request, "api-logout"),
            "register": _link(request, "api-register"),
        },
        "profile": {
            "profile": _link(request, "api-profile"),
            "profileHandle": _link(request, "api-profile-handle"),
        },
        "settings": {
            "security": _link(request, "api-settings-security"),
        },
        "public": {
            "resolve": _absolute(request, "/api/public/resolve/{ref}"),
        },
        "sessionAuth": {
            "login": _first_link(request, ["rest_framework:login", "login"]),
            "logout": _first_link(request, ["rest_framework:logout", "logout"]),
        },
        "chat": {
            "resolve": _link(request, "api-chat-resolve"),
            "inbox": _link(request, "api-chat-inbox"),
            "roomRolesTemplate": _absolute(request, "/api/chat/{room_id}/roles/"),
            "roomMemberRolesTemplate": _absolute(
                request,
                "/api/chat/{room_id}/members/{user_id}/roles/",
            ),
            "roomOverridesTemplate": _absolute(request, "/api/chat/{room_id}/overrides/"),
            "roomPermissionsMeTemplate": _absolute(
                request,
                "/api/chat/{room_id}/permissions/me/",
            ),
        },
        "friends": {
            "list": _link(request, "api-friends-list"),
            "sendRequest": _link(request, "api-friends-send-request"),
            "incomingRequests": _link(request, "api-friends-incoming"),
            "outgoingRequests": _link(request, "api-friends-outgoing"),
            "block": _link(request, "api-friends-block"),
        },
        "groups": {
            "create": _absolute(request, "/api/groups/"),
            "publicList": _absolute(request, "/api/groups/public/"),
            "detailTemplate": _absolute(request, "/api/groups/{room_id}/"),
            "invitePreviewTemplate": _absolute(request, "/api/invite/{code}/"),
            "inviteJoinTemplate": _absolute(request, "/api/invite/{code}/join/"),
        },
        "audit": {
            "events": _link(request, "api-admin-audit-events"),
            "actions": _link(request, "api-admin-audit-actions"),
        },
    }

    templates = {
        "publicResolve": _absolute(request, "/api/public/resolve/{ref}"),
        "authMedia": _absolute(request, "/api/auth/media/{path}?exp={unix}&sig={hmac}"),
        "chatRoomDetails": _absolute(request, "/api/chat/{room_id}/"),
        "chatRoomMessages": _absolute(request, "/api/chat/{room_id}/messages/?limit=50"),
        "chatRoomRoles": _absolute(request, "/api/chat/{room_id}/roles/"),
        "chatRoomRoleDetail": _absolute(request, "/api/chat/{room_id}/roles/{role_id}/"),
        "chatRoomMemberRoles": _absolute(request, "/api/chat/{room_id}/members/{user_id}/roles/"),
        "chatRoomOverrides": _absolute(request, "/api/chat/{room_id}/overrides/"),
        "chatRoomOverrideDetail": _absolute(
            request,
            "/api/chat/{room_id}/overrides/{override_id}/",
        ),
        "chatRoomPermissionsMe": _absolute(request, "/api/chat/{room_id}/permissions/me/"),
        "auditEventDetail": _absolute(request, "/api/admin/audit/events/{event_id}/"),
        "auditUsernameHistory": _absolute(request, "/api/admin/audit/users/{user_id}/username-history/"),
        "friendsRemove": _absolute(request, "/api/friends/{user_id}/"),
        "friendsAccept": _absolute(request, "/api/friends/requests/{friendship_id}/accept/"),
        "friendsDecline": _absolute(request, "/api/friends/requests/{friendship_id}/decline/"),
        "friendsUnblock": _absolute(request, "/api/friends/block/{user_id}/"),
    }

    return Response(
        {
            "status": "ok",
            "api": _absolute(request, "/api/"),
            "endpoints": endpoints,
            "templates": templates,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """Вспомогательная функция `api_root` реализует внутренний шаг бизнес-логики.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    return Response(
        {
            "status": "ok",
            "api": _absolute(request, "/api/"),
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_index, name="api-index"),
    path("api/health/live/", health.live, name="health-live"),
    path("api/health/ready/", health.ready, name="health-ready"),
    path("metrics/", app_metrics.render_metrics_response, name="metrics"),
    path("api/meta/client-config/", meta_api.client_config_view, name="api-client-config"),
    path("api/meta/visit/", meta_api.site_visit_view, name="api-site-visit"),
    path("api/auth/", include("users.urls")),
    path("api/profile/", users_api.profile_view, name="api-profile"),
    path("api/profile/handle/", users_api.profile_handle_view, name="api-profile-handle"),
    path("api/settings/security/", users_api.security_settings_view, name="api-settings-security"),
    path("api/public/resolve/<path:ref>/", users_api.public_resolve_view, name="api-public-resolve"),
    path("api/public/resolve/<path:ref>", users_api.public_resolve_view),
    path("api/chat/", include("chat.api_urls")),
    path("api/friends/", include("friends.interfaces.urls")),
    path("api/groups/", include("groups.interfaces.urls")),
    path("api/", include((_group_invite_urls, "groups-invite"))),
    path("api/admin/audit/", include("auditlog.interfaces.urls")),
    path("", api_root, name="api-root"),
]

if (
    settings.DEBUG
    or "rest_framework.renderers.BrowsableAPIRenderer"
    in settings.REST_FRAMEWORK.get("DEFAULT_RENDERER_CLASSES", [])
):
    urlpatterns += [path("api-auth/", include("rest_framework.urls"))]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

