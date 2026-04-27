import type { AxiosInstance } from "axios";

import { decodeMemberRolesResponse } from "../../dto";
import type { MemberRoles } from "../../entities/role/types";

/**
 * Устанавливает member roles.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param userId Идентификатор пользователя.
 * @param roleIds Список идентификаторов ролей.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function setMemberRoles(
  apiClient: AxiosInstance,
  roomId: string,
  userId: number,
  roleIds: number[],
): Promise<MemberRoles> {
  const response = await apiClient.patch<unknown>(
    `/chat/${encodeURIComponent(roomId)}/members/${userId}/roles/`,
    { roleIds },
  );
  return decodeMemberRolesResponse(response.data);
}
