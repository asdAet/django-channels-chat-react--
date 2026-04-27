import type { AxiosInstance } from "axios";

import type { RoomMessagesResponse } from "../../domain/interfaces/IApiService";
import { decodeRoomMessagesResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Loads messages for the selected room.
 *
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param params Query parameters.
 * @returns Room messages payload.
 */
export async function getRoomMessages(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; beforeId?: number },
): Promise<RoomMessagesResponse> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const query = new URLSearchParams();
  if (params?.limit) {
    query.set("limit", String(params.limit));
  }
  if (params?.beforeId) {
    query.set("before", String(params.beforeId));
  }

  const suffix = query.toString();
  const url = `/chat/${encodedRoomId}/messages/${suffix ? `?${suffix}` : ""}`;
  const response = await apiClient.get<unknown>(url);
  return decodeRoomMessagesResponse(response.data);
}

