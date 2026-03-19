import type { AxiosInstance } from "axios";

import type { DirectStartResponse } from "../../domain/interfaces/IApiService";
import { decodeDirectStartResponse } from "../../dto";


/**
 * Выполняет API-запрос для операции start direct chat.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param publicRef Публичный идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export const startDirectChat = async (
  apiClient: AxiosInstance,
  publicRef: string,
): Promise<DirectStartResponse> => {
  const response = await apiClient.post<unknown>("/chat/direct/start/", {
    ref: publicRef,
  });
  return decodeDirectStartResponse(response.data);
};
