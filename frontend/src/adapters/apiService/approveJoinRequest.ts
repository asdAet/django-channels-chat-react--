import type { AxiosInstance } from "axios";

export async function approveJoinRequest(
  apiClient: AxiosInstance,
  roomId: string,
  requestId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/requests/${requestId}/approve/`,
  );
}
