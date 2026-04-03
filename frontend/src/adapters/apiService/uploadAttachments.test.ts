import type { AxiosInstance, AxiosProgressEvent } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS,
  uploadAttachments,
} from "./uploadAttachments";

const buildSessionPayload = (overrides?: Partial<Record<string, unknown>>) => ({
  uploadId: "upload-1",
  originalFilename: "file.bin",
  contentType: "application/octet-stream",
  fileSize: 4,
  receivedBytes: 0,
  chunkSize: 4,
  status: "pending",
  expiresAt: "2026-04-03T00:00:00Z",
  ...overrides,
});

const createAxiosLikeError = (status: number): Error & {
  isAxiosError: true;
  response: { status: number };
} =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true as const,
    response: { status },
  });

afterEach(() => {
  vi.useRealTimers();
});

describe("uploadAttachments", () => {
  it("resolves public room refs before creating chunk sessions", async () => {
    const get = vi.fn();
    const put = vi.fn().mockResolvedValue({
      data: buildSessionPayload({
        receivedBytes: 1,
        fileSize: 1,
        status: "complete",
      }),
    });
    const deleteRequest = vi.fn();
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          targetKind: "public",
          roomId: 777,
          roomKind: "public",
          resolvedTarget: "public",
        },
      })
      .mockResolvedValueOnce({
        data: buildSessionPayload({
          fileSize: 1,
          chunkSize: 1,
        }),
      })
      .mockResolvedValueOnce({
        data: { id: 10, content: "", attachments: [] },
      });

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["x"], "unknown.bin", {
      type: "application/octet-stream",
    });
    const result = await uploadAttachments(apiClient, "public", [file]);

    expect(post).toHaveBeenNthCalledWith(1, "/chat/resolve/", {
      target: "public",
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/chat/777/attachments/uploads/",
      {
        originalFilename: "unknown.bin",
        contentType: "application/octet-stream",
        fileSize: 1,
      },
      expect.objectContaining({ timeout: 0 }),
    );
    expect(put).toHaveBeenCalledWith(
      "/chat/777/attachments/uploads/upload-1/chunk/",
      expect.any(Blob),
      expect.objectContaining({
        params: { offset: 0 },
        timeout: 0,
      }),
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "/chat/777/attachments/",
      {
        uploadIds: ["upload-1"],
        messageContent: "",
        replyTo: null,
      },
      expect.objectContaining({ timeout: 0 }),
    );
    expect(result.id).toBe(10);
    expect(get).not.toHaveBeenCalled();
    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it("uses byte-based progress from chunk uploads and switches into processing", async () => {
    const get = vi.fn();
    const deleteRequest = vi.fn();
    const onProgress = vi.fn();

    let resolveChunkRequest:
      | ((value: { data: Record<string, unknown> }) => void)
      | undefined;
    const put = vi.fn().mockImplementation((_url, _data, config) => {
      return new Promise<{ data: Record<string, unknown> }>((resolve) => {
        resolveChunkRequest = resolve;
        const progress = config.onUploadProgress as
          | ((event: AxiosProgressEvent) => void)
          | undefined;
        progress?.({
          loaded: 1,
          total: 4,
        } as AxiosProgressEvent);
      });
    });
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: buildSessionPayload({
          fileSize: 8,
          chunkSize: 8,
          originalFilename: "video.mp4",
          contentType: "video/mp4",
        }),
      })
      .mockResolvedValueOnce({
        data: { id: 11, content: "files", attachments: [] },
      });

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["12345678"], "video.mp4", { type: "video/mp4" });
    const promise = uploadAttachments(apiClient, "42", [file], { onProgress });

    for (let attempt = 0; attempt < 5 && put.mock.calls.length === 0; attempt += 1) {
      await Promise.resolve();
    }
    const requestConfig = put.mock.calls[0]?.[2] as {
      timeout?: number;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    };

    expect(requestConfig.timeout).toBe(0);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      phase: "uploading",
      uploadedBytes: 0,
      totalBytes: 8,
      percent: 0,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      phase: "uploading",
      uploadedBytes: 2,
      totalBytes: 8,
      percent: 25,
    });

    if (!resolveChunkRequest) {
      throw new Error("Chunk upload resolver was not captured");
    }

    resolveChunkRequest({
      data: buildSessionPayload({
        fileSize: 8,
        chunkSize: 8,
        originalFilename: "video.mp4",
        contentType: "video/mp4",
        receivedBytes: 8,
        status: "complete",
      }),
    });

    await expect(promise).resolves.toMatchObject({ id: 11 });
    expect(onProgress).toHaveBeenNthCalledWith(3, {
      phase: "uploading",
      uploadedBytes: 8,
      totalBytes: 8,
      percent: 100,
    });
    expect(onProgress).toHaveBeenNthCalledWith(4, {
      phase: "processing",
      uploadedBytes: 8,
      totalBytes: 8,
      percent: 100,
    });
  });

  it("uploads multi-chunk files sequentially and accumulates progress across chunks", async () => {
    const get = vi.fn();
    const deleteRequest = vi.fn();
    const onProgress = vi.fn();

    const put = vi
      .fn()
      .mockImplementationOnce((_url, _data, config) => {
        const progress = config.onUploadProgress as
          | ((event: AxiosProgressEvent) => void)
          | undefined;
        progress?.({
          loaded: 2,
          total: 4,
        } as AxiosProgressEvent);
        return Promise.resolve({
          data: buildSessionPayload({
            fileSize: 8,
            chunkSize: 4,
            receivedBytes: 4,
            status: "uploading",
          }),
        });
      })
      .mockImplementationOnce((_url, _data, config) => {
        const progress = config.onUploadProgress as
          | ((event: AxiosProgressEvent) => void)
          | undefined;
        progress?.({
          loaded: 2,
          total: 4,
        } as AxiosProgressEvent);
        return Promise.resolve({
          data: buildSessionPayload({
            fileSize: 8,
            chunkSize: 4,
            receivedBytes: 8,
            status: "complete",
          }),
        });
      });

    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: buildSessionPayload({
          fileSize: 8,
          chunkSize: 4,
        }),
      })
      .mockResolvedValueOnce({
        data: { id: 13, content: "", attachments: [] },
      });

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["12345678"], "two-chunks.bin", {
      type: "application/octet-stream",
    });

    await expect(
      uploadAttachments(apiClient, "42", [file], { onProgress }),
    ).resolves.toMatchObject({ id: 13 });

    expect(put).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenNthCalledWith(
      1,
      "/chat/42/attachments/uploads/upload-1/chunk/",
      expect.any(Blob),
      expect.objectContaining({
        params: { offset: 0 },
      }),
    );
    expect(put).toHaveBeenNthCalledWith(
      2,
      "/chat/42/attachments/uploads/upload-1/chunk/",
      expect.any(Blob),
      expect.objectContaining({
        params: { offset: 4 },
      }),
    );

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      phase: "uploading",
      uploadedBytes: 0,
      totalBytes: 8,
      percent: 0,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      phase: "uploading",
      uploadedBytes: 2,
      totalBytes: 8,
      percent: 25,
    });
    expect(onProgress).toHaveBeenNthCalledWith(3, {
      phase: "uploading",
      uploadedBytes: 4,
      totalBytes: 8,
      percent: 50,
    });
    expect(onProgress).toHaveBeenNthCalledWith(4, {
      phase: "uploading",
      uploadedBytes: 6,
      totalBytes: 8,
      percent: 75,
    });
    expect(onProgress).toHaveBeenNthCalledWith(5, {
      phase: "uploading",
      uploadedBytes: 8,
      totalBytes: 8,
      percent: 100,
    });
    expect(onProgress).toHaveBeenNthCalledWith(6, {
      phase: "processing",
      uploadedBytes: 8,
      totalBytes: 8,
      percent: 100,
    });
    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it("syncs session state after retryable chunk failures", async () => {
    const get = vi.fn().mockResolvedValue({
      data: buildSessionPayload({
        receivedBytes: 4,
        status: "complete",
      }),
    });
    const deleteRequest = vi.fn();
    const put = vi.fn().mockRejectedValue(createAxiosLikeError(409));
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: buildSessionPayload(),
      })
      .mockResolvedValueOnce({
        data: { id: 12, content: "", attachments: [] },
      });

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["1234"], "file.bin", {
      type: "application/octet-stream",
    });
    const result = await uploadAttachments(apiClient, "42", [file]);

    expect(put).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      "/chat/42/attachments/uploads/upload-1/",
      expect.objectContaining({ timeout: 0 }),
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/chat/42/attachments/",
      {
        uploadIds: ["upload-1"],
        messageContent: "",
        replyTo: null,
      },
      expect.objectContaining({ timeout: 0 }),
    );
    expect(result.id).toBe(12);
    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it("aborts temporary upload sessions if finalize fails", async () => {
    const get = vi.fn();
    const deleteRequest = vi.fn().mockResolvedValue(undefined);
    const put = vi.fn().mockResolvedValue({
      data: buildSessionPayload({
        receivedBytes: 4,
        status: "complete",
      }),
    });
    const finalizeError = createAxiosLikeError(500);
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: buildSessionPayload(),
      })
      .mockRejectedValueOnce(finalizeError);

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["1234"], "file.bin", {
      type: "application/octet-stream",
    });

    await expect(uploadAttachments(apiClient, "42", [file])).rejects.toBe(
      finalizeError,
    );

    expect(deleteRequest).toHaveBeenCalledWith(
      "/chat/42/attachments/uploads/upload-1/",
      expect.objectContaining({ timeout: 0 }),
    );
  });

  it("fails stalled chunk uploads after extended inactivity", async () => {
    vi.useFakeTimers();

    const get = vi.fn();
    const deleteRequest = vi.fn().mockResolvedValue(undefined);
    const post = vi.fn().mockResolvedValueOnce({
      data: buildSessionPayload(),
    });
    const put = vi.fn().mockImplementation((_url, _data, config) => {
      return new Promise((_resolve, reject) => {
        config.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    });

    const apiClient = {
      get,
      post,
      put,
      delete: deleteRequest,
    } as unknown as AxiosInstance;

    const file = new File(["1234"], "file.bin", {
      type: "application/octet-stream",
    });

    const promise = uploadAttachments(apiClient, "42", [file]);
    const stalledExpectation = expect(promise).rejects.toMatchObject({
      status: 408,
      message: expect.stringContaining("прогресса"),
    });

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS);
    await stalledExpectation;

    expect(deleteRequest).toHaveBeenCalledWith(
      "/chat/42/attachments/uploads/upload-1/",
      expect.objectContaining({ timeout: 0 }),
    );
  });
});
