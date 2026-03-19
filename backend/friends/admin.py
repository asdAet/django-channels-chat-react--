from django.contrib import admin

from .models import Friendship
from .utils import get_from_user_id, get_to_user_id


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    """Класс FriendshipAdmin настраивает поведение сущности в Django Admin."""
    list_display = (
        "id",
        "from_user",
        "from_user_id_value",
        "to_user",
        "to_user_id_value",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "created_at", "updated_at")
    search_fields = ("id", "from_user__username", "to_user__username")
    raw_id_fields = ("from_user", "to_user")
    list_select_related = ("from_user", "to_user")
    readonly_fields = ("created_at", "updated_at")
    fields = ("from_user", "to_user", "status", "created_at", "updated_at")
    actions = ("mark_pending", "mark_accepted", "mark_declined", "mark_blocked", "make_mutual_accepted")

    @admin.display(description="ID отправителя")
    def from_user_id_value(self, obj: Friendship) -> int | None:
        """Формирует значение from user id value для отображения в админ-панели.
        
        Args:
            obj: Параметр obj, используемый в логике функции.
        
        Returns:
            Объект типа int | None, сформированный в ходе выполнения.
        """
        return get_from_user_id(obj)

    @admin.display(description="ID получателя")
    def to_user_id_value(self, obj: Friendship) -> int | None:
        """Формирует значение to user id value для отображения в админ-панели.
        
        Args:
            obj: Параметр obj, используемый в логике функции.
        
        Returns:
            Объект типа int | None, сформированный в ходе выполнения.
        """
        return get_to_user_id(obj)

    def _set_status(self, queryset, status: str) -> int:
        """Устанавливает status с учетом текущих правил приложения.
        
        Args:
            queryset: Набор записей, к которому применяются фильтры.
            status: HTTP-статус ответа, который будет возвращен клиенту.
        
        Returns:
            Целочисленное значение результата вычисления.
        """
        updated = 0
        for friendship in queryset:
            if friendship.status == status:
                continue
            friendship.status = status
            friendship.save(update_fields=["status", "updated_at"])
            updated += 1
        return updated

    @admin.action(description="Установить статус: в ожидании")
    def mark_pending(self, request, queryset):
        """Помечает pending новым состоянием.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            queryset: Набор записей, к которому применяются фильтры.
        """
        updated = self._set_status(queryset, Friendship.Status.PENDING)
        self.message_user(request, f"Обновлено дружб: {updated}, статус «в ожидании».")

    @admin.action(description="Установить статус: принята")
    def mark_accepted(self, request, queryset):
        """Помечает accepted новым состоянием.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            queryset: Набор записей, к которому применяются фильтры.
        """
        updated = self._set_status(queryset, Friendship.Status.ACCEPTED)
        self.message_user(request, f"Обновлено дружб: {updated}, статус «принята».")

    @admin.action(description="Установить статус: отклонена")
    def mark_declined(self, request, queryset):
        """Помечает declined новым состоянием.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            queryset: Набор записей, к которому применяются фильтры.
        """
        updated = self._set_status(queryset, Friendship.Status.DECLINED)
        self.message_user(request, f"Обновлено дружб: {updated}, статус «отклонена».")

    @admin.action(description="Установить статус: заблокирована")
    def mark_blocked(self, request, queryset):
        """Помечает blocked новым состоянием.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            queryset: Набор записей, к которому применяются фильтры.
        """
        updated = self._set_status(queryset, Friendship.Status.BLOCKED)
        self.message_user(request, f"Обновлено дружб: {updated}, статус «заблокирована».")

    @admin.action(description="Сделать принятой + создать зеркальные записи")
    def make_mutual_accepted(self, request, queryset):
        """Формирует значение make mutual accepted для отображения в админ-панели.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            queryset: Набор записей, к которому применяются фильтры.
        """
        created_or_updated = 0
        for friendship in queryset.select_related("from_user", "to_user"):
            if friendship.status != Friendship.Status.ACCEPTED:
                friendship.status = Friendship.Status.ACCEPTED
                friendship.save(update_fields=["status", "updated_at"])
            Friendship.objects.update_or_create(
                from_user=friendship.to_user,
                to_user=friendship.from_user,
                defaults={"status": Friendship.Status.ACCEPTED},
            )
            created_or_updated += 1
        self.message_user(request, f"Обработано пар дружбы: {created_or_updated}.")
