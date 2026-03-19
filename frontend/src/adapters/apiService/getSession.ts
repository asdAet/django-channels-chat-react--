import type { AxiosInstance } from "axios";

import type { SessionResponse } from "../../domain/interfaces/IApiService";
import { decodeSessionResponse } from "../../dto";

/**
 * Возвращает session.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getSession(
  apiClient: AxiosInstance,
): Promise<SessionResponse> {
  const response = await apiClient.get<unknown>("/auth/session/");
  return decodeSessionResponse(response.data);
}
