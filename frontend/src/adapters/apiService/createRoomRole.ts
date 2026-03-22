import type { AxiosInstance } from "axios";

import { decodeRoleResponse } from "../../dto";
import type { Role } from "../../entities/role/types";

/**
 * Асинхронно создаёт комнаты роли.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function createRoomRole(
  apiClient: AxiosInstance,
  roomId: string,
  data: { name: string; color?: string; permissions?: number },
): Promise<Role> {
  const response = await apiClient.post<unknown>(
    `/chat/${encodeURIComponent(roomId)}/roles/`,
    data,
  );
  return decodeRoleResponse(response.data);
}
