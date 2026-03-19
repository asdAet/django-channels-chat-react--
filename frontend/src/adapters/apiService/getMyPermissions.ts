import type { AxiosInstance } from "axios";

import { decodeMyPermissionsResponse } from "../../dto";
import type { MyPermissions } from "../../entities/role/types";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Возвращает my permissions.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
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
