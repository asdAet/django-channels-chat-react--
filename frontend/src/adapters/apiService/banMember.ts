import type { AxiosInstance } from "axios";

export async function banMember(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  reason?: string,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/members/${userId}/ban/`,
    reason ? { reason } : {},
  );
}
