import type { AxiosInstance } from "axios";

import type { SessionResponse } from "../../domain/interfaces/IApiService";
import { buildRegisterRequestDto, decodeSessionResponse } from "../../dto";

/**
 * Выполняет API-запрос для операции register.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param login Аргумент `login` текущего вызова.
 * @param password Пароль пользователя.
 * @param passwordConfirm Аргумент `passwordConfirm` текущего вызова.
 * @param name Имя параметра или ключа, который используется в операции.
 * @param username Имя пользователя.
 * @param email Email пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function register(
  apiClient: AxiosInstance,
  login: string,
  password: string,
  passwordConfirm: string,
  name: string,
  username?: string,
  email?: string,
): Promise<SessionResponse> {
  const body = buildRegisterRequestDto({
    login,
    password,
    passwordConfirm,
    name,
    username,
    email,
  });
  const response = await apiClient.post<unknown>("/auth/register/", body);
  return decodeSessionResponse(response.data);
}
