import type { AxiosInstance } from "axios";

export async function deleteRoomOverride(
  apiClient: AxiosInstance,
  roomId: string,
  overrideId: number,
): Promise<void> {
  await apiClient.delete(
    `/chat/rooms/${encodeURIComponent(roomId)}/overrides/${overrideId}/`,
  );
}
