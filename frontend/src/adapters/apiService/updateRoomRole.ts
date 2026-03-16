import type { AxiosInstance } from "axios";

import { decodeRoleResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

export async function updateRoomRole(
  apiClient: AxiosInstance,
  roomId: string,
  roleId: number,
  data: Partial<{
    name: string;
    color: string;
    permissions: number;
    position: number;
  }>,
): Promise<Role> {
  const response = await apiClient.patch<unknown>(
    `/chat/rooms/${encodeURIComponent(roomId)}/roles/${roleId}/`,
    data,
  );
  return decodeRoleResponse(response.data);
}
