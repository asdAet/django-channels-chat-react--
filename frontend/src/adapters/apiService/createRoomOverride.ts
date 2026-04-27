import type { AxiosInstance } from "axios";

import { decodeOverrideResponse } from "../../dto";
import type { PermissionOverride } from "../../entities/role/types";

/**
 * Асинхронно создаёт комнаты override.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
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
    `/chat/${encodeURIComponent(roomId)}/overrides/`,
    data,
  );
  return decodeOverrideResponse(response.data);
}
