import type { AxiosInstance } from "axios";

import { decodePinnedMessagesResponse } from "../../dto";
import type { PinnedMessage } from "../../entities/group/types";

/**
 * Возвращает pinned messages.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getPinnedMessages(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<PinnedMessage[]> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/pins/`,
  );
  return decodePinnedMessagesResponse(response.data);
}
