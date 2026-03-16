import type { AxiosInstance } from "axios";

import { decodeRoomAttachmentsResponse } from "../../dto";
import type { RoomAttachmentsResult } from "../../domain/interfaces/IApiService";
import { resolveRoomId } from "./resolveRoomId";

export async function getRoomAttachments(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; before?: number },
): Promise<RoomAttachmentsResult> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const searchParams = new URLSearchParams();
  if (typeof params?.limit === "number")
    searchParams.set("limit", String(params.limit));
  if (typeof params?.before === "number")
    searchParams.set("before", String(params.before));
  const query = searchParams.toString();
  const response = await apiClient.get<unknown>(
    `/chat/rooms/${encodedRoomRef}/attachments/${query ? `?${query}` : ""}`,
  );
  return decodeRoomAttachmentsResponse(response.data);
}
