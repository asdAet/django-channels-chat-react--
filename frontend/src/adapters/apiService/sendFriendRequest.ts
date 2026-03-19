import type { AxiosInstance } from "axios";

import { decodeSendFriendRequestResponse } from "../../dto";
import type { SendFriendRequestResponse } from "../../dto/http/friends";

/**
 * Выполняет API-запрос для операции send friend request.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param publicRef Публичный идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function sendFriendRequest(
  apiClient: AxiosInstance,
  publicRef: string,
): Promise<SendFriendRequestResponse> {
  const response = await apiClient.post<unknown>("/friends/requests/", {
    ref: publicRef,
  });
  return decodeSendFriendRequestResponse(response.data);
}
