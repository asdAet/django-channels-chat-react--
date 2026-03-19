import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции mute member.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @param durationSeconds Длительность действия в секундах.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function muteMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  durationSeconds = 3600,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/mute/`,
    { durationSeconds },
  );
}
