import type { AxiosInstance } from "axios";

import type { MessageReadersResult } from "../../domain/interfaces/IApiService";
import { decodeMessageReadersResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Loads read receipts for a specific message.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param messageId Message identifier.
 * @returns Readers payload.
 */
export async function getMessageReaders(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<MessageReadersResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const response = await apiClient.get<unknown>(
    `/chat/${encodedRoomId}/messages/${messageId}/readers/`,
  );
  return decodeMessageReadersResponse(response.data);
}

