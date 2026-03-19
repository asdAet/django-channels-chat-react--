import type { AxiosInstance } from "axios";

import type { SearchResult } from "../../domain/interfaces/IApiService";
import { decodeSearchResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Выполняет API-запрос для операции search messages.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param query Поисковый запрос.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function searchMessages(
  apiClient: AxiosInstance,
  roomId: string,
  query: string,
): Promise<SearchResult> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const response = await apiClient.get<unknown>(
    `/chat/rooms/${encodedRoomRef}/messages/search/?q=${encodeURIComponent(query)}`,
  );
  return decodeSearchResponse(response.data);
}
