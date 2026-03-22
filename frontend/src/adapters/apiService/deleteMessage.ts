import type { AxiosInstance } from "axios";

import { resolveRoomId } from "./resolveRoomId";

/**
 * Deletes a message in the selected room.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param messageId Message identifier.
 */
export async function deleteMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  await apiClient.delete(`/chat/${encodedRoomId}/messages/${messageId}/`);
}

