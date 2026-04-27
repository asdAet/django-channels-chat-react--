import type { AxiosInstance } from "axios";

/**
 * Удаляет room role.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param roleId Идентификатор роли.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function deleteRoomRole(
  apiClient: AxiosInstance,
  roomId: string,
  roleId: number,
): Promise<void> {
  await apiClient.delete(
    `/chat/${encodeURIComponent(roomId)}/roles/${roleId}/`,
  );
}
