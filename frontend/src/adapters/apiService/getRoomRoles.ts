import type { AxiosInstance } from "axios";

import { decodeRolesListResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

export async function getRoomRoles(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<Role[]> {
  const response = await apiClient.get<unknown>(
    `/chat/rooms/${encodeURIComponent(roomId)}/roles/`,
  );
  return decodeRolesListResponse(response.data);
}
