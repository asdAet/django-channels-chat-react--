import type { AxiosInstance } from "axios";

import type { SessionResponse } from "../../domain/interfaces/IApiService";
import { buildOAuthGoogleRequestDto, decodeSessionResponse } from "../../dto";

/**
 * Выполняет API-запрос для операции oauth google.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param token Токен аутентификации.
 * @param tokenType Тип токена аутентификации.
 * @param username Имя пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function oauthGoogle(
  apiClient: AxiosInstance,
  token: string,
  tokenType: "idToken" | "accessToken" = "idToken",
  username?: string,
): Promise<SessionResponse> {
  const normalizedToken = token.trim();
  const body = buildOAuthGoogleRequestDto(
    tokenType === "accessToken"
      ? { accessToken: normalizedToken, username }
      : { idToken: normalizedToken, username },
  );

  const response = await apiClient.post<unknown>("/auth/oauth/google/", body);
  return decodeSessionResponse(response.data);
}
