import type { AxiosInstance } from "axios";

export async function transferOwnership(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/transfer-ownership/`,
    { userId },
  );
}
