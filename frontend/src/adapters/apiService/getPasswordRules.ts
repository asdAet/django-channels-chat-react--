import type { AxiosInstance } from "axios";

import { decodePasswordRulesResponse } from "../../dto";

/**
 * Возвращает password rules.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getPasswordRules(
  apiClient: AxiosInstance,
): Promise<{ rules: string[] }> {
  const response = await apiClient.get<unknown>("/auth/password-rules/");
  return decodePasswordRulesResponse(response.data);
}
