import axios, { type AxiosInstance, type AxiosProgressEvent } from "axios";

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
export const ATTACHMENT_UPLOAD_MAX_RECOVERY_ATTEMPTS = 2;

type UploadSessionDto = {
  uploadId: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  receivedBytes: number;
  chunkSize: number;
  status: "pending" | "uploading" | "complete";
  expiresAt: string;
};

type UploadSessionState = UploadSessionDto & {
  file: File;
};

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

const clampUploadedBytes = (value: number, totalBytes: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value >= totalBytes) {
    return totalBytes;
  }
  return Math.round(value);
};

const buildUploadProgress = (
  phase: UploadProgress["phase"],
  uploadedBytes: number,
  totalBytes: number,
): UploadProgress => ({
  phase,
  uploadedBytes: clampUploadedBytes(uploadedBytes, totalBytes),
  totalBytes,
  percent:
    totalBytes > 0
      ? clampRatio(uploadedBytes / totalBytes) * 100
      : phase === "processing"
        ? 100
        : 0,
});

const parseUploadSession = (input: unknown): UploadSessionDto => {
  if (!isRecord(input)) {
    throw new Error("Invalid attachment upload session payload");
  }

  const {
    uploadId,
    originalFilename,
    contentType,
    fileSize,
    receivedBytes,
    chunkSize,
    status,
    expiresAt,
  } = input;

  if (
    typeof uploadId !== "string" ||
    typeof originalFilename !== "string" ||
    typeof contentType !== "string" ||
    typeof expiresAt !== "string" ||
    typeof fileSize !== "number" ||
    typeof receivedBytes !== "number" ||
    typeof chunkSize !== "number" ||
    (status !== "pending" && status !== "uploading" && status !== "complete")
  ) {
    throw new Error("Invalid attachment upload session payload");
  }

  return {
    uploadId,
    originalFilename,
    contentType,
    fileSize,
    receivedBytes,
    chunkSize,
    status,
    expiresAt,
  };
};

const getAcknowledgedUploadedBytes = (sessions: UploadSessionState[]): number =>
  sessions.reduce(
    (total, session) => total + Math.min(session.file.size, session.receivedBytes),
    0,
  );

const updateSessionState = (
  session: UploadSessionState,
  payload: UploadSessionDto,
): void => {
  session.originalFilename = payload.originalFilename;
  session.contentType = payload.contentType;
  session.fileSize = payload.fileSize;
  session.receivedBytes = payload.receivedBytes;
  session.chunkSize = payload.chunkSize;
  session.status = payload.status;
  session.expiresAt = payload.expiresAt;
};

const isRetryableChunkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status ?? 0;
  return status === 0 || status === 409 || status >= 500;
};

const emitUploadProgress = (
  options: UploadAttachmentsOptions | undefined,
  phase: UploadProgress["phase"],
  uploadedBytes: number,
  totalBytes: number,
): void => {
  options?.onProgress?.(buildUploadProgress(phase, uploadedBytes, totalBytes));
};

const syncUploadSession = async (
  apiClient: AxiosInstance,
  roomId: string,
  session: UploadSessionState,
  signal: AbortSignal,
): Promise<UploadSessionDto | null> => {
  try {
    const response = await apiClient.get<unknown>(
      `/chat/${encodeURIComponent(roomId)}/attachments/uploads/${encodeURIComponent(session.uploadId)}/`,
      {
        signal,
        timeout: 0,
      },
    );
    return parseUploadSession(response.data);
  } catch {
    return null;
  }
};

const abortUploadSessions = async (
  apiClient: AxiosInstance,
  roomId: string,
  sessions: UploadSessionState[],
): Promise<void> => {
  await Promise.allSettled(
    sessions.map((session) =>
      apiClient.delete(
        `/chat/${encodeURIComponent(roomId)}/attachments/uploads/${encodeURIComponent(session.uploadId)}/`,
        { timeout: 0 },
      ),
    ),
  );
};

export async function uploadAttachments(
  apiClient: AxiosInstance,
  roomId: string,
  files: File[],
  options?: UploadAttachmentsOptions,
): Promise<UploadResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const totalFileBytes = getTotalFileBytes(files);
  const sessions: UploadSessionState[] = [];

  const uploadController = new AbortController();
  let stalledByInactivity = false;
  let stalledWhileProcessing = false;
  let finalized = false;
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

  emitUploadProgress(options, "uploading", 0, totalFileBytes);

  try {
    for (const file of files) {
      const response = await apiClient.post<unknown>(
        `/chat/${encodedRoomId}/attachments/uploads/`,
        {
          originalFilename: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        },
        {
          signal: uploadController.signal,
          timeout: 0,
        },
      );
      const session = parseUploadSession(response.data);
      sessions.push({ ...session, file });
    }

    for (const session of sessions) {
      while (session.receivedBytes < session.file.size) {
        const chunkStartOffset = session.receivedBytes;
        const chunk = session.file.slice(
          chunkStartOffset,
          chunkStartOffset + session.chunkSize,
        );

        let uploadedThisChunk = 0;
        let completedChunk = false;

        for (
          let attempt = 0;
          attempt <= ATTACHMENT_UPLOAD_MAX_RECOVERY_ATTEMPTS && !completedChunk;
          attempt += 1
        ) {
          const progressBaseBytes = getAcknowledgedUploadedBytes(sessions);
          refreshIdleTimer();

          try {
            const response = await apiClient.put<unknown>(
              `/chat/${encodedRoomId}/attachments/uploads/${encodeURIComponent(session.uploadId)}/chunk/`,
              chunk,
              {
                params: { offset: chunkStartOffset },
                headers: {
                  "Content-Type": "application/octet-stream",
                },
                onUploadProgress: (event: AxiosProgressEvent) => {
                  const total = event.total && event.total > 0 ? event.total : chunk.size;
                  uploadedThisChunk = Math.max(
                    uploadedThisChunk,
                    Math.min(chunk.size, Math.round((event.loaded / total) * chunk.size)),
                  );
                  refreshIdleTimer();
                  emitUploadProgress(
                    options,
                    "uploading",
                    progressBaseBytes + uploadedThisChunk,
                    totalFileBytes,
                  );
                },
                signal: uploadController.signal,
                timeout: 0,
              },
            );

            clearIdleTimer();
            updateSessionState(session, parseUploadSession(response.data));
            emitUploadProgress(
              options,
              "uploading",
              getAcknowledgedUploadedBytes(sessions),
              totalFileBytes,
            );
            completedChunk = true;
          } catch (error) {
            clearIdleTimer();
            if (uploadController.signal.aborted) {
              throw error;
            }

            const syncedSession = await syncUploadSession(
              apiClient,
              apiRoomId,
              session,
              uploadController.signal,
            );
            if (syncedSession) {
              updateSessionState(session, syncedSession);
              emitUploadProgress(
                options,
                "uploading",
                getAcknowledgedUploadedBytes(sessions),
                totalFileBytes,
              );
              if (session.receivedBytes > chunkStartOffset) {
                completedChunk = true;
                break;
              }
            }

            if (
              attempt >= ATTACHMENT_UPLOAD_MAX_RECOVERY_ATTEMPTS ||
              !isRetryableChunkError(error)
            ) {
              throw error;
            }
          }
        }
      }
    }

    emitUploadProgress(options, "processing", totalFileBytes, totalFileBytes);
    startProcessingTimer();
    const response = await apiClient.post<unknown>(
      `/chat/${encodedRoomId}/attachments/`,
      {
        uploadIds: sessions.map((session) => session.uploadId),
        messageContent: options?.messageContent ?? "",
        replyTo: options?.replyTo ?? null,
      },
      {
        signal: uploadController.signal,
        timeout: 0,
      },
    );
    finalized = true;
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
    if (!finalized && sessions.length > 0) {
      await abortUploadSessions(apiClient, apiRoomId, sessions);
    }
  }
}
