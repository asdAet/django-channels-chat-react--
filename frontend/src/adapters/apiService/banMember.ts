import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции ban member.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @param reason Причина административного действия.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function banMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  reason?: string,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/ban/`,
    reason ? { reason } : {},
  );
}
