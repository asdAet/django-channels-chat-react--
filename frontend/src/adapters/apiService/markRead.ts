import type { AxiosInstance } from "axios";

import type { ReadStateResult } from "../../domain/interfaces/IApiService";
import { decodeReadStateResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Marks a room as read up to the specified message.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param messageId Optional last read message id.
 * @returns Updated read state.
 */
export async function markRead(
  apiClient: AxiosInstance,
  roomId: string,
  messageId?: number,
): Promise<ReadStateResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const body = messageId ? { lastReadMessageId: messageId } : {};
  const response = await apiClient.post<unknown>(
    `/chat/${encodedRoomId}/read/`,
    body,
  );
  return decodeReadStateResponse(response.data);
}

