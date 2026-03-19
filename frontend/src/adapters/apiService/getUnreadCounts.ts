import type { AxiosInstance } from "axios";

import type { UnreadCountItem } from "../../domain/interfaces/IApiService";
import { decodeUnreadCountsResponse } from "../../dto";

/**
 * Возвращает unread counts.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getUnreadCounts(
  apiClient: AxiosInstance,
): Promise<UnreadCountItem[]> {
  const response = await apiClient.get<unknown>("/chat/rooms/unread/");
  return decodeUnreadCountsResponse(response.data);
}
