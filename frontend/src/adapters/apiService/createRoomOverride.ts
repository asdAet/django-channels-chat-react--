import type { AxiosInstance } from "axios";

import { decodeOverrideResponse } from "../../dto";
import type { PermissionOverride } from "../../entities/role/types";

export async function createRoomOverride(
  apiClient: AxiosInstance,
  roomId: string,
  data: {
    targetRoleId?: number;
    targetUserId?: number;
    allow?: number;
    deny?: number;
  },
): Promise<PermissionOverride> {
  const response = await apiClient.post<unknown>(
    `/chat/rooms/${encodeURIComponent(roomId)}/overrides/`,
    data,
  );
  return decodeOverrideResponse(response.data);
}
