import type { AxiosInstance } from "axios";

import { decodeBlockedListResponse } from "../../dto/http/friends";
import type { BlockedUser } from "../../entities/friend/types";

/**
 * Возвращает blocked users.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getBlockedUsers(
  apiClient: AxiosInstance,
): Promise<BlockedUser[]> {
  const response = await apiClient.get("/friends/blocked/");
  return decodeBlockedListResponse(response.data);
}
