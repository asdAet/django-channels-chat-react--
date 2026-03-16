import type { AxiosInstance } from "axios";
import { resolveRoomId } from "./resolveRoomId";

export async function deleteMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  await apiClient.delete(`/chat/rooms/${encodedRoomRef}/messages/${messageId}/`);
}
