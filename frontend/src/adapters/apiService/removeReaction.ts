import type { AxiosInstance } from "axios";
import { resolveRoomId } from "./resolveRoomId";

export async function removeReaction(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  emoji: string,
): Promise<void> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  await apiClient.delete(
    `/chat/rooms/${encodedRoomRef}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/`,
  );
}
