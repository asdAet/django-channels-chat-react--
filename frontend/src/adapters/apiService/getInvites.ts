import type { AxiosInstance } from "axios";

import { decodeInvitesResponse } from "../../dto";
import type { GroupInvite } from "../../entities/group/types";

/**
 * Возвращает invites.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getInvites(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<GroupInvite[]> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/invites/`,
  );
  return decodeInvitesResponse(response.data);
}
