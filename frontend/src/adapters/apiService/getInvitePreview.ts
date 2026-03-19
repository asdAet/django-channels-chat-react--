import type { AxiosInstance } from "axios";

import { decodeInvitePreviewResponse } from "../../dto";
import type { InvitePreview } from "../../entities/group/types";

/**
 * Возвращает invite preview.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param code Код приглашения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function getInvitePreview(
  apiClient: AxiosInstance,
  code: string,
): Promise<InvitePreview> {
  const response = await apiClient.get<unknown>(
    `/invite/${encodeURIComponent(code)}/`,
  );
  return decodeInvitePreviewResponse(response.data);
}
