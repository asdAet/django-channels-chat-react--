import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции revoke invite.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param code Код приглашения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function revokeInvite(
  apiClient: AxiosInstance,
  roomId: string,
  code: string,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/invites/${encodeURIComponent(code)}/`,
  );
}
