import type { AxiosInstance } from "axios";

export async function joinGroup(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<void> {
  await apiClient.post(`/groups/${encodeURIComponent(roomId)}/join/`);
}
