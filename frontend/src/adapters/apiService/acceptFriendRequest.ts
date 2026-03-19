import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции accept friend request.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param friendshipId Идентификатор связи дружбы.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function acceptFriendRequest(
  apiClient: AxiosInstance,
  friendshipId: number,
): Promise<void> {
  await apiClient.post(`/friends/requests/${friendshipId}/accept/`);
}
