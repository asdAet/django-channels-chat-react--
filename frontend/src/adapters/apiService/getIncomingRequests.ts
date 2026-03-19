import type { AxiosInstance } from "axios";

import { decodeIncomingRequestsResponse } from "../../dto";
import type { FriendRequest } from "../../entities/friend/types";

/**
 * Возвращает incoming requests.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getIncomingRequests(
  apiClient: AxiosInstance,
): Promise<FriendRequest[]> {
  const response = await apiClient.get<unknown>("/friends/requests/incoming/");
  return decodeIncomingRequestsResponse(response.data);
}
