import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции unblock user.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param userId Идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function unblockUser(
  apiClient: AxiosInstance,
  userId: number,
): Promise<void> {
  await apiClient.delete(`/friends/block/${userId}/`);
}
