import type { AxiosInstance } from "axios";

export async function muteMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  durationSeconds = 3600,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/mute/`,
    { durationSeconds },
  );
}
