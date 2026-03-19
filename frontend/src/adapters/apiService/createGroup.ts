import type { AxiosInstance } from "axios";

import { decodeGroupResponse } from "../../dto";
import type { Group } from "../../entities/group/types";

/**
 * Асинхронно создаёт группы.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function createGroup(
  apiClient: AxiosInstance,
  data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string | null;
  },
): Promise<Group> {
  const response = await apiClient.post<unknown>("/groups/", data);
  return decodeGroupResponse(response.data);
}
