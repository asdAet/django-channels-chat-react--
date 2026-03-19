import type { AxiosInstance } from "axios";

import type { ReactionResult } from "../../domain/interfaces/IApiService";
import { decodeReactionResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Добавляет reaction.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @param emoji Эмодзи реакции.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function addReaction(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  emoji: string,
): Promise<ReactionResult> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const response = await apiClient.post<unknown>(
    `/chat/rooms/${encodedRoomRef}/messages/${messageId}/reactions/`,
    { emoji },
  );
  return decodeReactionResponse(response.data);
}
