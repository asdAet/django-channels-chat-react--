from rooms.models import Room

from .constants import PUBLIC_ROOM_NAME, PUBLIC_ROOM_SLUG


def public_rooms(request):
    Room.objects.get_or_create(slug=PUBLIC_ROOM_SLUG, defaults={"name": PUBLIC_ROOM_NAME})
    rooms = Room.objects.all()
    return {'rooms': rooms}
