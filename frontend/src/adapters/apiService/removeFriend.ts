import type { AxiosInstance } from "axios";

/**
 * Удаляет friend.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param userId Идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function removeFriend(
  apiClient: AxiosInstance,
  userId: number,
): Promise<void> {
  await apiClient.delete(`/friends/${userId}/`);
}
