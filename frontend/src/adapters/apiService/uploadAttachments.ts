import type { AxiosInstance, AxiosProgressEvent } from "axios";

import type {
  UploadAttachmentsOptions,
  UploadResult,
} from "../../domain/interfaces/IApiService";
import { decodeUploadResponse } from "../../dto";
import type { ApiError } from "../../shared/api/types";
import { resolveRoomId } from "./resolveRoomId";

export const ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS = 120_000;

const createUploadIdleTimeoutError = (): ApiError => ({
  status: 408,
  message:
    "Загрузка файла прервана: слишком долго нет прогресса. Проверьте соединение и повторите попытку.",
});

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

  const uploadController = new AbortController();
  let stalledByInactivity = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearIdleTimer = () => {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const refreshIdleTimer = () => {
    clearIdleTimer();
    idleTimer = globalThis.setTimeout(() => {
      stalledByInactivity = true;
      uploadController.abort();
    }, ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS);
  };

  const handleExternalAbort = () => {
    uploadController.abort();
  };

  if (options?.signal) {
    if (options.signal.aborted) {
      uploadController.abort();
    } else {
      options.signal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  refreshIdleTimer();

  try {
    const response = await apiClient.post<unknown>(
      `/chat/${encodedRoomId}/attachments/`,
      formData,
      {
        onUploadProgress: (event: AxiosProgressEvent) => {
          refreshIdleTimer();
          if (event.total && event.total > 0) {
            options?.onProgress?.(
              Math.round((event.loaded / event.total) * 100),
            );
          }
        },
        signal: uploadController.signal,
        timeout: 0,
      },
    );
    return decodeUploadResponse(response.data);
  } catch (error) {
    if (stalledByInactivity) {
      throw createUploadIdleTimeoutError();
    }
    throw error;
  } finally {
    clearIdleTimer();
    options?.signal?.removeEventListener("abort", handleExternalAbort);
  }
}
