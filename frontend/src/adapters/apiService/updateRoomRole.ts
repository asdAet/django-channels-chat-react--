import type { AxiosInstance } from "axios";

import { decodeRoleResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

/**
 * Асинхронно обновляет комнаты роли.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param roleId Идентификатор роли.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
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
    `/chat/${encodeURIComponent(roomId)}/roles/${roleId}/`,
    data,
  );
  return decodeRoleResponse(response.data);
}
