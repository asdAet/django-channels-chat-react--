import type { AxiosInstance, AxiosProgressEvent } from "axios";

import type {
  UploadAttachmentsOptions,
  UploadProgress,
  UploadResult,
} from "../../domain/interfaces/IApiService";
import { decodeUploadResponse } from "../../dto";
import type { ApiError } from "../../shared/api/types";
import { resolveRoomId } from "./resolveRoomId";

export const ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS = 120_000;
export const ATTACHMENT_UPLOAD_PROCESSING_TIMEOUT_MS = 300_000;

const createUploadIdleTimeoutError = (): ApiError => ({
  status: 408,
  message:
    "Загрузка файла прервана: слишком долго нет прогресса. Проверьте соединение и повторите попытку.",
});

const createUploadProcessingTimeoutError = (): ApiError => ({
  status: 504,
  message:
    "Сервер слишком долго обрабатывает загруженные файлы. Попробуйте еще раз чуть позже.",
});

const getTotalFileBytes = (files: File[]): number =>
  files.reduce((total, file) => total + file.size, 0);

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

const buildUploadProgress = (
  phase: UploadProgress["phase"],
  ratio: number,
  totalBytes: number,
): UploadProgress => {
  const normalizedRatio = clampRatio(ratio);
  return {
    phase,
    percent: normalizedRatio * 100,
    uploadedBytes:
      totalBytes > 0 ? Math.round(totalBytes * normalizedRatio) : 0,
    totalBytes,
  };
};

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
  const totalFileBytes = getTotalFileBytes(files);
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
  let stalledWhileProcessing = false;
  let uploadCompleted = false;
  let lastProgressRatio = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let processingTimer: ReturnType<typeof setTimeout> | null = null;

  const clearIdleTimer = () => {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const clearProcessingTimer = () => {
    if (processingTimer !== null) {
      clearTimeout(processingTimer);
      processingTimer = null;
    }
  };

  const refreshIdleTimer = () => {
    clearIdleTimer();
    idleTimer = globalThis.setTimeout(() => {
      stalledByInactivity = true;
      uploadController.abort();
    }, ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS);
  };

  const startProcessingTimer = () => {
    clearProcessingTimer();
    processingTimer = globalThis.setTimeout(() => {
      stalledWhileProcessing = true;
      uploadController.abort();
    }, ATTACHMENT_UPLOAD_PROCESSING_TIMEOUT_MS);
  };

  const emitProgress = (
    phase: UploadProgress["phase"],
    ratio: number,
  ): void => {
    options?.onProgress?.(buildUploadProgress(phase, ratio, totalFileBytes));
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

  emitProgress("uploading", 0);
  refreshIdleTimer();

  try {
    const response = await apiClient.post<unknown>(
      `/chat/${encodedRoomId}/attachments/`,
      formData,
      {
        onUploadProgress: (event: AxiosProgressEvent) => {
          const referenceTotal =
            event.total && event.total > 0
              ? event.total
              : totalFileBytes > 0
                ? totalFileBytes
                : 1;
          lastProgressRatio = Math.max(
            lastProgressRatio,
            clampRatio(event.loaded / referenceTotal),
          );

          if (lastProgressRatio >= 1) {
            if (!uploadCompleted) {
              uploadCompleted = true;
              clearIdleTimer();
              startProcessingTimer();
            }
            emitProgress("processing", 1);
            return;
          }

          refreshIdleTimer();
          emitProgress("uploading", lastProgressRatio);
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
    if (stalledWhileProcessing) {
      throw createUploadProcessingTimeoutError();
    }
    throw error;
  } finally {
    clearIdleTimer();
    clearProcessingTimer();
    options?.signal?.removeEventListener("abort", handleExternalAbort);
  }
}
