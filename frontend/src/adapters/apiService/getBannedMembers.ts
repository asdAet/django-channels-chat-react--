import type { AxiosInstance } from "axios";

import { decodeBannedMembersResponse } from "../../dto";
import type { BannedMember } from "../../entities/group/types";

/**
 * Описывает результат операции `BannedMembers`.
 */
export type BannedMembersResult = {
  items: BannedMember[];
  total: number;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

/**
 * Асинхронно возвращает заблокированные участников.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param params Параметры запроса.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getBannedMembers(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; before?: number },
): Promise<BannedMembersResult> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/banned/`,
    { params },
  );
  return decodeBannedMembersResponse(response.data);
}
