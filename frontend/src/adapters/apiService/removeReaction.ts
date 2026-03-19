import type { AxiosInstance } from "axios";

import { resolveRoomId } from "./resolveRoomId";

/**
 * Удаляет reaction.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @param emoji Эмодзи реакции.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function removeReaction(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  emoji: string,
): Promise<void> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  await apiClient.delete(
    `/chat/rooms/${encodedRoomRef}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/`,
  );
}
