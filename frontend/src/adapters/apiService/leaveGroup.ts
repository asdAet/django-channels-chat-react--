import type { AxiosInstance } from "axios";

export async function leaveGroup(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<void> {
  await apiClient.post(`/groups/${encodeURIComponent(roomId)}/leave/`);
}
