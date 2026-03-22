import type { AxiosInstance } from "axios";

import type { RoomAttachmentsResult } from "../../domain/interfaces/IApiService";
import { decodeRoomAttachmentsResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Loads attachments for the selected room.
 *
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param params Query parameters.
 * @returns Room attachments payload.
 */
export async function getRoomAttachments(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; before?: number },
): Promise<RoomAttachmentsResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const searchParams = new URLSearchParams();
  if (typeof params?.limit === "number")
    searchParams.set("limit", String(params.limit));
  if (typeof params?.before === "number")
    searchParams.set("before", String(params.before));
  const query = searchParams.toString();
  const response = await apiClient.get<unknown>(
    `/chat/${encodedRoomId}/attachments/${query ? `?${query}` : ""}`,
  );
  return decodeRoomAttachmentsResponse(response.data);
}

