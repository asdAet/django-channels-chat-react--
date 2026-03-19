import type { AxiosInstance } from "axios";

import { decodeRoomDetailsResponse } from "../../dto";
import type { RoomDetails } from "../../entities/room/types";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Возвращает room details.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomRef Текстовая ссылка или числовой идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getRoomDetails(
  apiClient: AxiosInstance,
  roomRef: string,
): Promise<RoomDetails> {
  const apiRoomRef = await resolveRoomId(apiClient, roomRef);
  const logicalRoomRef = roomRef === "public" ? "public" : roomRef;

  const encodedRef = encodeURIComponent(apiRoomRef);
  const response = await apiClient.get<unknown>(`/chat/rooms/${encodedRef}/`);
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as Record<string, unknown>)
      : {};

  return decodeRoomDetailsResponse({
    ...payload,
    roomRef: logicalRoomRef,
  });
}
