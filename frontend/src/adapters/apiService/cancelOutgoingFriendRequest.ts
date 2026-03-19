import type { AxiosInstance } from "axios";

/**
 * Проверяет условие cancel outgoing friend request.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param friendshipId Идентификатор связи дружбы.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function cancelOutgoingFriendRequest(
  apiClient: AxiosInstance,
  friendshipId: number,
): Promise<void> {
  await apiClient.delete(`/friends/requests/${friendshipId}/cancel/`);
}
