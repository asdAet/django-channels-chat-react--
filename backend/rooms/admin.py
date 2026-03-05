from django.contrib import admin

from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "kind", "direct_pair_key", "created_by")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug", "direct_pair_key")
    list_filter = ("kind",)
