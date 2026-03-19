import type { AxiosInstance } from "axios";

/**
 * Удаляет group.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function deleteGroup(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${encodeURIComponent(roomId)}/`);
}
