import type { AxiosInstance } from "axios";

export async function deleteRoomRole(
  apiClient: AxiosInstance,
  roomId: string,
  roleId: number,
): Promise<void> {
  await apiClient.delete(
    `/chat/rooms/${encodeURIComponent(roomId)}/roles/${roleId}/`,
  );
}
