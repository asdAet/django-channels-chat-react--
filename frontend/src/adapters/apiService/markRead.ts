import type { AxiosInstance } from "axios";

import { decodeReadStateResponse } from "../../dto";
import type { ReadStateResult } from "../../domain/interfaces/IApiService";
import { resolveRoomId } from "./resolveRoomId";

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
