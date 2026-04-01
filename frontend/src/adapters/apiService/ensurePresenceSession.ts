import type { AxiosInstance } from "axios";

import { decodePresenceSessionResponse } from "../../dto";

/**
 * Гарантирует presence session.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function ensurePresenceSession(
  apiClient: AxiosInstance,
): Promise<{ ok: boolean; wsAuthToken: string | null }> {
  const response = await apiClient.get<unknown>("/auth/presence-session/");
  return decodePresenceSessionResponse(response.data);
}
