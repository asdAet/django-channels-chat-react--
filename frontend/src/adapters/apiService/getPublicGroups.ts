import type { AxiosInstance } from "axios";

import { decodeGroupListResponse } from "../../dto";
import type { GroupListItem } from "../../entities/group/types";

/**
 * Описывает параметры вызова для `PublicGroups`.
 */
export type PublicGroupsParams = {
  search?: string;
  limit?: number;
  before?: number;
};

/**
 * Описывает результат операции `PublicGroups`.
 */
export type PublicGroupsResult = {
  items: GroupListItem[];
  total: number;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

/**
 * Возвращает public groups.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param params Параметры запроса.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getPublicGroups(
  apiClient: AxiosInstance,
  params?: PublicGroupsParams,
): Promise<PublicGroupsResult> {
  const response = await apiClient.get<unknown>("/groups/public/", { params });
  return decodeGroupListResponse(response.data);
}
