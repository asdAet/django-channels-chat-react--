import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции join group.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function joinGroup(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<void> {
  await apiClient.post(`/groups/${encodeURIComponent(roomId)}/join/`);
}
