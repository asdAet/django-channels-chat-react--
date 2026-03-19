import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции decline friend request.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param friendshipId Идентификатор связи дружбы.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function declineFriendRequest(
  apiClient: AxiosInstance,
  friendshipId: number,
): Promise<void> {
  await apiClient.post(`/friends/requests/${friendshipId}/decline/`);
}
