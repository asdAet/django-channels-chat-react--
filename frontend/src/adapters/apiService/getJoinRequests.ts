import type { AxiosInstance } from "axios";

import { decodeJoinRequestsResponse } from "../../dto";
import type { JoinRequest } from "../../entities/group/types";

/**
 * Возвращает join requests.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getJoinRequests(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<JoinRequest[]> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/requests/`,
  );
  return decodeJoinRequestsResponse(response.data);
}
