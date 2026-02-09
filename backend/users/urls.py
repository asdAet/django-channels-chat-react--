from django.urls import path

from . import api

urlpatterns = [
    path("csrf/", api.csrf_token, name="api-csrf-token"),
    path("session/", api.session_view, name="api-session"),
    path("login/", api.login_view, name="api-login"),
    path("logout/", api.logout_view, name="api-logout"),
    path("register/", api.register_view, name="api-register"),
    path("password-rules/", api.password_rules, name="api-password-rules"),
    path("profile/", api.profile_view, name="api-profile"),
]
