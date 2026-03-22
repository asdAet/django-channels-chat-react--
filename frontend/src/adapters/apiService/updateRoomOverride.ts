import type { AxiosInstance } from "axios";

import { decodeOverrideResponse } from "../../dto";
import type { PermissionOverride } from "../../entities/role/types";

/**
 * Асинхронно обновляет комнаты override.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param overrideId Идентификатор переопределения прав.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function updateRoomOverride(
  apiClient: AxiosInstance,
  roomId: string,
  overrideId: number,
  data: Partial<{ allow: number; deny: number }>,
): Promise<PermissionOverride> {
  const response = await apiClient.patch<unknown>(
    `/chat/${encodeURIComponent(roomId)}/overrides/${overrideId}/`,
    data,
  );
  return decodeOverrideResponse(response.data);
}
