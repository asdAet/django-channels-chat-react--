import type { AxiosInstance } from "axios";

import { decodeLogoutResponse } from "../../dto";

/**
 * Выполняет API-запрос для операции logout.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function logout(
  apiClient: AxiosInstance,
): Promise<{ ok: boolean }> {
  const response = await apiClient.post<unknown>("/auth/logout/");
  return decodeLogoutResponse(response.data);
}
