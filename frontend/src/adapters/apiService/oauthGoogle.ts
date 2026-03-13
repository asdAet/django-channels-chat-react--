import type { AxiosInstance } from "axios";

import { buildOAuthGoogleRequestDto, decodeSessionResponse } from "../../dto";
import type { SessionResponse } from "../../domain/interfaces/IApiService";

/**
 * Выполняет вход/регистрацию через Google OAuth.
 * @param apiClient HTTP-клиент.
 * @param accessToken Access token от Google OAuth2.
 * @returns Декодированное состояние сессии.
 */
export async function oauthGoogle(
  apiClient: AxiosInstance,
  accessToken: string,
): Promise<SessionResponse> {
  const body = buildOAuthGoogleRequestDto({ accessToken });
  const response = await apiClient.post<unknown>("/auth/oauth/google/", body);
  return decodeSessionResponse(response.data);
}
