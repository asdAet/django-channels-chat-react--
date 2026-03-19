import type { AxiosInstance } from "axios";

import { decodeFriendsListResponse } from "../../dto";
import type { Friend } from "../../entities/friend/types";

/**
 * Возвращает friends.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getFriends(apiClient: AxiosInstance): Promise<Friend[]> {
  const response = await apiClient.get<unknown>("/friends/");
  return decodeFriendsListResponse(response.data);
}
