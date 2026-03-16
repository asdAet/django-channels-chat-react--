import type { AxiosInstance } from "axios";

import { decodeMemberRolesResponse } from "../../dto";
import type { MemberRoles } from "../../entities/role/types";

export async function setMemberRoles(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  roleIds: number[],
): Promise<MemberRoles> {
  const response = await apiClient.patch<unknown>(
    `/chat/rooms/${encodeURIComponent(roomId)}/members/${userId}/roles/`,
    { roleIds },
  );
  return decodeMemberRolesResponse(response.data);
}
