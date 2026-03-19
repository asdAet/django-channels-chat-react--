import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции pin message.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function pinMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  await apiClient.post(`/groups/${encodeURIComponent(roomId)}/pins/`, {
    messageId,
  });
}
