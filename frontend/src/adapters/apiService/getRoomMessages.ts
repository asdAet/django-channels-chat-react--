import type { AxiosInstance } from "axios";

import type { RoomMessagesResponse } from "../../domain/interfaces/IApiService";
import { decodeRoomMessagesResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Асинхронно возвращает комнаты сообщений.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param params Параметры запроса.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getRoomMessages(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; beforeId?: number },
): Promise<RoomMessagesResponse> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const query = new URLSearchParams();
  if (params?.limit) {
    query.set("limit", String(params.limit));
  }
  if (params?.beforeId) {
    query.set("before", String(params.beforeId));
  }

  const suffix = query.toString();
  const url = `/chat/rooms/${encodedRoomRef}/messages/${suffix ? `?${suffix}` : ""}`;
  const response = await apiClient.get<unknown>(url);
  return decodeRoomMessagesResponse(response.data);
}
