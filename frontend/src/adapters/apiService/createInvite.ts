import type { AxiosInstance } from "axios";

import { decodeInviteResponse } from "../../dto";
import type { GroupInvite } from "../../entities/group/types";

/**
 * Асинхронно создаёт приглашение.
 *
 * @param apiClient HTTP-клиент для выполнения API-запросов.
 * @param roomId Идентификатор комнаты.
 * @param data Данные запроса или полезная нагрузка операции.
 *
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function createInvite(
  apiClient: AxiosInstance,
  roomId: string,
  data?: { maxUses?: number; expiresInHours?: number },
): Promise<GroupInvite> {
  const payload = {
    maxUses: data?.maxUses ?? 0,
    expiresInSeconds:
      typeof data?.expiresInHours === "number" && data.expiresInHours > 0
        ? Math.floor(data.expiresInHours * 3600)
        : undefined,
  };
  const response = await apiClient.post<unknown>(
    `/groups/${encodeURIComponent(roomId)}/invites/`,
    payload,
  );
  return decodeInviteResponse(response.data);
}
