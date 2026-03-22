import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции join via invite.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param code Код приглашения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function joinViaInvite(
  apiClient: AxiosInstance,
  code: string,
): Promise<{ roomId: number; groupPublicRef?: string | null }> {
  const response = await apiClient.post<{
    roomId?: number | string;
    groupPublicRef?: string | null;
  }>(
    `/invite/${encodeURIComponent(code)}/join/`,
  );
  const payload =
    typeof response.data === "object" && response.data !== null
      ? (response.data as Record<string, unknown>)
      : {};
  const roomId =
    typeof payload.roomId === "number"
      ? payload.roomId
      : Number(payload.roomId ?? NaN);
  return {
    roomId: Number.isFinite(roomId) ? Math.trunc(roomId) : 0,
    groupPublicRef:
      typeof payload.groupPublicRef === "string"
        ? payload.groupPublicRef.trim() || null
        : null,
  };
}
