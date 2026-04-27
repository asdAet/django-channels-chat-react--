import type { AxiosInstance } from "axios";

import type { EditMessageResult } from "../../domain/interfaces/IApiService";
import { decodeEditMessageResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Выполняет API-запрос для операции edit message.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param messageId Идентификатор сообщения.
 * @param content Текст сообщения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function editMessage(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  content: string,
): Promise<EditMessageResult> {
  const resolvedRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(resolvedRoomId);
  const response = await apiClient.patch<unknown>(
    `/chat/${encodedRoomId}/messages/${messageId}/`,
    { content },
  );
  return decodeEditMessageResponse(response.data);
}
