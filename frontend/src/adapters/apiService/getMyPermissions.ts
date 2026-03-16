import type { AxiosInstance } from "axios";

import { decodeMyPermissionsResponse } from "../../dto";
import type { MyPermissions } from "../../entities/role/types";
import { resolveRoomId } from "./resolveRoomId";

export async function getMyPermissions(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<MyPermissions> {
  const roomRef = await resolveRoomId(apiClient, roomId);
  const response = await apiClient.get<unknown>(
    `/chat/rooms/${encodeURIComponent(roomRef)}/permissions/me/`,
  );
  return decodeMyPermissionsResponse(response.data);
}
