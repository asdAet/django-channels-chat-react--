import type { AxiosInstance } from "axios";

import { decodeMyPermissionsResponse } from "../../dto";
import type { MyPermissions } from "../../entities/role/types";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Loads the current user's permissions for a room.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @returns Permissions payload.
 */
export async function getMyPermissions(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<MyPermissions> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const response = await apiClient.get<unknown>(
    `/chat/${encodeURIComponent(apiRoomId)}/permissions/me/`,
  );
  return decodeMyPermissionsResponse(response.data);
}

