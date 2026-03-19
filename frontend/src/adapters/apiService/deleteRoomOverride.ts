import type { AxiosInstance } from "axios";

/**
 * Удаляет room override.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param overrideId Идентификатор переопределения прав.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function deleteRoomOverride(
  apiClient: AxiosInstance,
  roomId: string,
  overrideId: number,
): Promise<void> {
  await apiClient.delete(
    `/chat/rooms/${encodeURIComponent(roomId)}/overrides/${overrideId}/`,
  );
}
