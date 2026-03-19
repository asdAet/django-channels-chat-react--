import type { AxiosInstance } from "axios";

import { decodeProfileEnvelopeResponse } from "../../dto";
import type { UserProfile } from "../../entities/user/types";

/**
 * Возвращает user profile.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param ref Аргумент `ref` текущего вызова.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getUserProfile(
  apiClient: AxiosInstance,
  ref: string,
): Promise<{ user: UserProfile }> {
  const safe = encodeURIComponent(ref);
  const response = await apiClient.get<unknown>(`/public/resolve/${safe}`);
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as Record<string, unknown>)
      : {};
  return decodeProfileEnvelopeResponse({ user: payload.user });
}
