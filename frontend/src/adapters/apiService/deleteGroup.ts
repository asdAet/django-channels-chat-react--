import type { AxiosInstance } from "axios";

export async function deleteGroup(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${encodeURIComponent(roomId)}/`);
}
