import type { AxiosInstance } from "axios";

import { decodeOutgoingRequestsResponse } from "../../dto";
import type { FriendRequest } from "../../entities/friend/types";

/**
 * Возвращает outgoing requests.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getOutgoingRequests(
  apiClient: AxiosInstance,
): Promise<FriendRequest[]> {
  const response = await apiClient.get<unknown>("/friends/requests/outgoing/");
  return decodeOutgoingRequestsResponse(response.data);
}
