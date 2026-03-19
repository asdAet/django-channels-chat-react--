import type { AxiosInstance } from "axios";

import { resolveRoomId } from "./resolveRoomId";

/**
 * Удаляет message.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function deleteMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  await apiClient.delete(`/chat/rooms/${encodedRoomRef}/messages/${messageId}/`);
}
