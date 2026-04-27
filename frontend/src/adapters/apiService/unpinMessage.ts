import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции unpin message.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function unpinMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/pins/${messageId}/`,
  );
}
