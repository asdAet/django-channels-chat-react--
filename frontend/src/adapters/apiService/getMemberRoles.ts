import type { AxiosInstance } from "axios";

import { decodeMemberRolesResponse } from "../../dto";
import type { MemberRoles } from "../../entities/role/types";

/**
 * Возвращает member roles.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getMemberRoles(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
): Promise<MemberRoles> {
  const response = await apiClient.get<unknown>(
    `/chat/${encodeURIComponent(roomId)}/members/${userId}/roles/`,
  );
  return decodeMemberRolesResponse(response.data);
}
