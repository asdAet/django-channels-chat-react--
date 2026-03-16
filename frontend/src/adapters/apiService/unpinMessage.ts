import type { AxiosInstance } from "axios";

export async function unpinMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/pins/${messageId}/`,
  );
}
