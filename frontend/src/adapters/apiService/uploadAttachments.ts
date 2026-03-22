import type { AxiosInstance } from "axios";

import type {
  UploadAttachmentsOptions,
  UploadResult,
} from "../../domain/interfaces/IApiService";
import { decodeUploadResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Uploads message attachments for the selected room.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param files Files to upload.
 * @param options Optional upload settings.
 * @returns Upload result payload.
 */
export async function uploadAttachments(
  apiClient: AxiosInstance,
  roomId: string,
  files: File[],
  options?: UploadAttachmentsOptions,
): Promise<UploadResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
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
    `/chat/${encodedRoomId}/attachments/`,
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

