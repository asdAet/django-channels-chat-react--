import type { AxiosInstance } from "axios";

import { decodeRolesListResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

/**
 * Возвращает room roles.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getRoomRoles(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<Role[]> {
  const response = await apiClient.get<unknown>(
    `/chat/${encodeURIComponent(roomId)}/roles/`,
  );
  return decodeRolesListResponse(response.data);
}
