from django.urls import path

from . import api

urlpatterns = [
    path("public-room/", api.public_room, name="api-public-room"),
    path("rooms/<path:room_slug>/messages/", api.room_messages, name="api-room-messages"),
    path("rooms/<path:room_slug>/", api.room_details, name="api-room-details"),
]
