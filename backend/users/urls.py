"""URL routes for users auth/profile APIs."""

from django.urls import path

from . import api

urlpatterns = [
    path("csrf/", api.csrf_token, name="api-csrf-token"),
    path("session/", api.session_view, name="api-session"),
    path("presence-session/", api.presence_session_view, name="api-presence-session"),
    path("password-rules/", api.password_rules_view, name="api-password-rules"),
    path("login/", api.login_view, name="api-login"),
    path("oauth/google/start/", api.oauth_google_start_view, name="api-oauth-google-start"),
    path("oauth/google/callback/", api.oauth_google_callback_view, name="api-oauth-google-callback"),
    path("oauth/google/", api.oauth_google_view, name="api-oauth-google"),
    path("logout/", api.logout_view, name="api-logout"),
    path("register/", api.register_view, name="api-register"),
    path("media/<path:file_path>", api.media_view, name="api-media"),
]
