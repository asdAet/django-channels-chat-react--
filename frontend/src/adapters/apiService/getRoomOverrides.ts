import type { AxiosInstance } from "axios";

import { decodeOverridesResponse } from "../../dto";
import type { PermissionOverride } from "../../entities/role/types";

/**
 * Возвращает room overrides.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getRoomOverrides(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<PermissionOverride[]> {
  const response = await apiClient.get<unknown>(
    `/chat/${encodeURIComponent(roomId)}/overrides/`,
  );
  return decodeOverridesResponse(response.data);
}
