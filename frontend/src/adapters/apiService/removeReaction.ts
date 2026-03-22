import type { AxiosInstance } from "axios";

import { resolveRoomId } from "./resolveRoomId";

/**
 * Removes the current user's reaction from a message.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param messageId Message identifier.
 * @param emoji Reaction emoji.
 */
export async function removeReaction(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  emoji: string,
): Promise<void> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  await apiClient.delete(
    `/chat/${encodedRoomId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/`,
  );
}

