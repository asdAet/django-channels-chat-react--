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
  roomTarget: string,
): Promise<RoomDetails> {
  const apiRoomId = await resolveRoomId(apiClient, roomTarget);
  const logicalRoomRef = roomTarget === "public" ? "public" : roomTarget;

  const encodedRoomId = encodeURIComponent(apiRoomId);
  const response = await apiClient.get<unknown>(`/chat/${encodedRoomId}/`);
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as Record<string, unknown>)
      : {};

  return decodeRoomDetailsResponse({
    ...payload,
    roomRef: logicalRoomRef,
  });
}
