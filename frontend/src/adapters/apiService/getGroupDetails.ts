import type { AxiosInstance } from "axios";

import { decodeGroupResponse } from "../../dto";
import type { Group } from "../../entities/group/types";

/**
 * Возвращает group details.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getGroupDetails(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<Group> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/`,
  );
  return decodeGroupResponse(response.data);
}
