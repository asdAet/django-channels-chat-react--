import type { AxiosInstance } from "axios";

export async function unbanMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/unban/`,
  );
}
