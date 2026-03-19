import type { AxiosInstance } from "axios";

import type {
  UploadAttachmentsOptions,
  UploadResult,
} from "../../domain/interfaces/IApiService";
import { decodeUploadResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Выполняет API-запрос для операции upload attachments.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param roomId Идентификатор комнаты.
 * @param files Список файлов для загрузки.
 * @param options Опциональные параметры поведения.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function uploadAttachments(
  apiClient: AxiosInstance,
  roomId: string,
  files: File[],
  options?: UploadAttachmentsOptions,
): Promise<UploadResult> {
  const apiRoomRef = await resolveRoomId(apiClient, roomId);
  const encodedRoomRef = encodeURIComponent(apiRoomRef);
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (typeof options?.messageContent === "string") {
    formData.append("messageContent", options.messageContent);
  }
  if (typeof options?.replyTo === "number") {
    formData.append("replyTo", String(options.replyTo));
  }
  const response = await apiClient.post<unknown>(
    `/chat/rooms/${encodedRoomRef}/attachments/`,
    formData,
    options?.onProgress
      ? {
          onUploadProgress: (event) => {
            if (event.total) {
              options.onProgress?.(
                Math.round((event.loaded / event.total) * 100),
              );
            }
          },
          signal: options.signal,
        }
      : { signal: options?.signal },
  );
  return decodeUploadResponse(response.data);
}
