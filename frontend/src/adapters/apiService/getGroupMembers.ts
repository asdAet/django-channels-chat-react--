import type { AxiosInstance } from "axios";

import { decodeGroupMembersResponse } from "../../dto";
import type { GroupMember } from "../../entities/group/types";

/**
 * Описывает результат операции `GroupMembers`.
 */
export type GroupMembersResult = {
  items: GroupMember[];
  total: number;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

/**
 * Асинхронно возвращает группы участников.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param params Параметры запроса.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getGroupMembers(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; before?: number },
): Promise<GroupMembersResult> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/members/`,
    { params },
  );
  return decodeGroupMembersResponse(response.data);
}
