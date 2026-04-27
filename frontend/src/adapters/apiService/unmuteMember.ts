import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции unmute member.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function unmuteMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/unmute/`,
  );
}
