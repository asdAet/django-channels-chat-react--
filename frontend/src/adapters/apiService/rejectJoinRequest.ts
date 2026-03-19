import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции reject join request.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param requestId Идентификатор заявки.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function rejectJoinRequest(
  apiClient: AxiosInstance,
  roomId: string,
  requestId: number,
): Promise<void> {
  await apiClient.post(
    `/groups/${encodeURIComponent(roomId)}/requests/${requestId}/reject/`,
  );
}
