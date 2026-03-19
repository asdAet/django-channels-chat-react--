import type { AxiosInstance } from "axios";

import type { ReadStateResult } from "../../domain/interfaces/IApiService";
import { decodeReadStateResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Выполняет API-запрос для операции mark read.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function markRead(
  apiClient: AxiosInstance,
  roomId: string,
  messageId?: number,
): Promise<ReadStateResult> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const body = messageId ? { lastReadMessageId: messageId } : {};
  const response = await apiClient.post<unknown>(
    `/chat/rooms/${encodedRoomRef}/read/`,
    body,
  );
  return decodeReadStateResponse(response.data);
}
