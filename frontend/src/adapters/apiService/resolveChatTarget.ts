import type { AxiosInstance } from "axios";

import type { ChatResolveResult } from "../../domain/interfaces/IApiService";
import { decodeChatResolveResponse } from "../../dto";

/**
 * Разрешает внешний target чата в канонический `roomId` и метаданные комнаты.
 *
 * Используется как единая точка входа для навигации по `publicRef/publicId`,
 * чтобы фронтенд не строил внутренние room-маршруты напрямую.
 *
 * @param apiClient Сконфигурированный HTTP-клиент для обращения к backend API.
 * @param target Публичный target чата, пользователя или группы, который нужно разрешить.
 * @returns Полный результат resolve-операции с `roomId`, видом комнаты и публичными идентификаторами.
 */
export const resolveChatTarget = async (
  apiClient: AxiosInstance,
  target: string,
): Promise<ChatResolveResult> => {
  const response = await apiClient.post<unknown>("/chat/resolve/", {
    target,
  });
  return decodeChatResolveResponse(response.data);
};
