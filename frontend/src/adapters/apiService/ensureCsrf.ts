import type { AxiosInstance } from "axios";

import { decodeCsrfResponse } from "../../dto";

/**
 * Гарантирует csrf.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function ensureCsrf(
  apiClient: AxiosInstance,
): Promise<{ csrfToken: string }> {
  const response = await apiClient.get<unknown>("/auth/csrf/");
  return decodeCsrfResponse(response.data);
}
