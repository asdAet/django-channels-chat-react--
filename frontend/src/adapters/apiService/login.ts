import type { AxiosInstance } from "axios";

import { buildLoginRequestDto, decodeSessionResponse } from "../../dto";
import type { SessionResponse } from "../../domain/interfaces/IApiService";

/**
 * Выполняет логин пользователя.
 * @param apiClient HTTP-клиент.
 * @param email Email.
 * @param password Пароль.
 * @returns Декодированное состояние сессии.
 */
export async function login(
  apiClient: AxiosInstance,
  email: string,
  password: string,
): Promise<SessionResponse> {
  const body = buildLoginRequestDto({ email, password });
  const response = await apiClient.post<unknown>("/auth/login/", body);
  return decodeSessionResponse(response.data);
}
