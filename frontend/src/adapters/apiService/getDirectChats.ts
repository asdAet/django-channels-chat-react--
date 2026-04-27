import type { AxiosInstance } from "axios";

import type { DirectChatsResponse } from "../../domain/interfaces/IApiService";
import { decodeDirectChatsResponse } from "../../dto";

/**
 * Возвращает direct chats.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */

export const getDirectChats = async (
  apiClient: AxiosInstance,
): Promise<DirectChatsResponse> => {
  const response = await apiClient.get<unknown>("/chat/inbox/");
  return decodeDirectChatsResponse(response.data);
};
