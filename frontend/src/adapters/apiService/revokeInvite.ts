import type { AxiosInstance } from "axios";

export async function revokeInvite(
  apiClient: AxiosInstance,
  roomId: string,
  code: string,
): Promise<void> {
  await apiClient.delete(
    `/groups/${encodeURIComponent(roomId)}/invites/${encodeURIComponent(code)}/`,
  );
}
