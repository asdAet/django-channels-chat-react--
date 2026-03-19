import type { AxiosInstance } from "axios";

import { decodePublicRoomResponse } from "../../dto";
import type { RoomDetails } from "../../entities/room/types";

/**
 * Возвращает public room.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getPublicRoom(
  apiClient: AxiosInstance,
): Promise<RoomDetails> {
  const response = await apiClient.get<unknown>("/chat/public-room/");
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as Record<string, unknown>)
      : {};
  return decodePublicRoomResponse({
    ...payload,
    roomRef: "public",
  });
}
