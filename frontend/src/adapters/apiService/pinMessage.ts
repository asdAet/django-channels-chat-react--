import type { AxiosInstance } from "axios";

export async function pinMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  await apiClient.post(`/groups/${encodeURIComponent(roomId)}/pins/`, {
    messageId,
  });
}
