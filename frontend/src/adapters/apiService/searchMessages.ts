import type { AxiosInstance } from "axios";

import type { SearchResult } from "../../domain/interfaces/IApiService";
import { decodeSearchResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Searches messages inside the selected room.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param query Search query.
 * @returns Search payload.
 */
export async function searchMessages(
  apiClient: AxiosInstance,
  roomId: string,
  query: string,
): Promise<SearchResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const response = await apiClient.get<unknown>(
    `/chat/${encodedRoomId}/messages/search/?q=${encodeURIComponent(query)}`,
  );
  return decodeSearchResponse(response.data);
}

