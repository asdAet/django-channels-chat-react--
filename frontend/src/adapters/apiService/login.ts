import type { AxiosInstance } from "axios";

import type { SessionResponse } from "../../domain/interfaces/IApiService";
import { buildLoginRequestDto, decodeSessionResponse } from "../../dto";

/**
 * Выполняет API-запрос для операции login.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param identifier Идентификатор сущности, с которой выполняется операция.
 * @param password Пароль пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function login(
  apiClient: AxiosInstance,
  identifier: string,
  password: string,
): Promise<SessionResponse> {
  const body = buildLoginRequestDto({ identifier, password });
  const response = await apiClient.post<unknown>("/auth/login/", body);
  return decodeSessionResponse(response.data);
}
