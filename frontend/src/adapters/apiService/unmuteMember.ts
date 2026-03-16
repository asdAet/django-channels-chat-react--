import type { AxiosInstance } from "axios";

export async function unmuteMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/unmute/`,
  );
}
