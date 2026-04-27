import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции kick member.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function kickMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/`,
  );
}
