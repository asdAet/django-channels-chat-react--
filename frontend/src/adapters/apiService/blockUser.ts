import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции block user.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param publicRef Публичный идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function blockUser(
  apiClient: AxiosInstance,
  publicRef: string,
): Promise<void> {
  await apiClient.post("/friends/block/", { ref: publicRef });
}
