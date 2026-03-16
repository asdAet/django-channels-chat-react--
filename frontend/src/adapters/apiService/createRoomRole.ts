import type { AxiosInstance } from "axios";

import { decodeRoleResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

export async function createRoomRole(
  apiClient: AxiosInstance,
  roomId: string,
  data: { name: string; color?: string; permissions?: number },
): Promise<Role> {
  const response = await apiClient.post<unknown>(
    `/chat/rooms/${encodeURIComponent(roomId)}/roles/`,
    data,
  );
  return decodeRoleResponse(response.data);
}
