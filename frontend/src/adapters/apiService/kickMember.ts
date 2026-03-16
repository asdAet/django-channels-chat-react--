import type { AxiosInstance } from "axios";

export async function kickMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/`,
  );
}
