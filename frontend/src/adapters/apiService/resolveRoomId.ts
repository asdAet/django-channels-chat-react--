import type { AxiosInstance } from "axios";

/**
 * Выполняет API-запрос для операции to positive room id string.
 * @param value Входное значение для преобразования.
 * @returns Строковое значение результата.
 */
const toPositiveRoomIdString = (value: unknown): string | null => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(Math.trunc(parsed));
};

/**
 * Определяет room id.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomRef Текстовая ссылка или числовой идентификатор комнаты.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function resolveRoomId(
  apiClient: AxiosInstance,
  roomRef: string,
): Promise<string> {
  if (roomRef !== "public") {
    return roomRef;
  }

  const publicRoomResponse = await apiClient.get<unknown>("/chat/public-room/");
  const publicPayload =
    typeof publicRoomResponse.data === "object" &&
    publicRoomResponse.data !== null
      ? (publicRoomResponse.data as Record<string, unknown>)
      : {};

  const resolved = toPositiveRoomIdString(publicPayload.roomId);
  if (!resolved) {
    throw new Error("Failed to resolve public room id");
  }
  return resolved;
}
