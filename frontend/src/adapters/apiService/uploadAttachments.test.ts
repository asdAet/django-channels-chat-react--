import type { AxiosInstance, AxiosProgressEvent } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS,
  uploadAttachments,
} from "./uploadAttachments";

afterEach(() => {
  vi.useRealTimers();
});

describe("uploadAttachments", () => {
  it("resolves public room ref before upload", async () => {
    const get = vi.fn();
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          targetKind: "public",
          roomId: 777,
          roomKind: "public",
          resolvedTarget: "public",
          room: {
            roomId: 777,
            name: "Public",
            kind: "public",
          },
        },
      })
      .mockResolvedValueOnce({
        data: { id: 10, content: "", attachments: [] },
      });
    const apiClient = { get, post } as unknown as AxiosInstance;

    const file = new File(["x"], "unknown.bin", {
      type: "application/octet-stream",
    });
    const result = await uploadAttachments(apiClient, "public", [file]);

    expect(get).not.toHaveBeenCalled();
    expect(post).toHaveBeenNthCalledWith(1, "/chat/resolve/", {
      target: "public",
    });
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][0]).toBe("/chat/777/attachments/");
    expect(post.mock.calls[1][1]).toBeInstanceOf(FormData);
    expect(result.id).toBe(10);
  });

  it("uses non-public room ref as-is", async () => {
    const get = vi.fn();
    const post = vi
      .fn()
      .mockResolvedValue({ data: { id: 11, content: "", attachments: [] } });
    const apiClient = { get, post } as unknown as AxiosInstance;

    const file = new File(["x"], "file.bin", {
      type: "application/octet-stream",
    });
    await uploadAttachments(apiClient, "42", [file]);

    expect(get).not.toHaveBeenCalled();
    expect(post.mock.calls[0][0]).toBe("/chat/42/attachments/");
  });

  it("disables the fixed request timeout for uploads and forwards progress", async () => {
    const get = vi.fn();
    const post = vi
      .fn()
      .mockResolvedValue({ data: { id: 11, content: "", attachments: [] } });
    const apiClient = { get, post } as unknown as AxiosInstance;
    const onProgress = vi.fn();

    const file = new File(["x"], "file.bin", {
      type: "application/octet-stream",
    });
    await uploadAttachments(apiClient, "42", [file], { onProgress });

    const requestConfig = post.mock.calls[0][2] as {
      timeout?: number;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    };

    expect(requestConfig.timeout).toBe(0);
    requestConfig.onUploadProgress?.({
      loaded: 1,
      total: 4,
    } as AxiosProgressEvent);
    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it("aborts stalled uploads only after extended inactivity", async () => {
    vi.useFakeTimers();

    const get = vi.fn();
    const post = vi.fn().mockImplementation((_url, _data, config) => {
      return new Promise((_resolve, reject) => {
        config.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    });
    const apiClient = { get, post } as unknown as AxiosInstance;

    const file = new File(["x"], "slow.bin", {
      type: "application/octet-stream",
    });
    const promise = uploadAttachments(apiClient, "42", [file]);
    const stalledExpectation = expect(promise).rejects.toMatchObject({
      status: 408,
      message: expect.stringContaining("слишком долго нет прогресса"),
    });

    await Promise.resolve();
    const requestConfig = post.mock.calls[0][2] as { signal?: AbortSignal };

    await vi.advanceTimersByTimeAsync(ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS - 1);
    expect(requestConfig.signal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await stalledExpectation;
  });

  it("refreshes the inactivity watchdog when upload progress advances", async () => {
    vi.useFakeTimers();

    const get = vi.fn();
    let resolveRequest:
      | ((value: { data: { id: number; content: string; attachments: [] } }) => void)
      | null = null;
    const post = vi.fn().mockImplementation((_url, _data, config) => {
      return new Promise((resolve, reject) => {
        resolveRequest = resolve as typeof resolveRequest;
        config.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    });
    const apiClient = { get, post } as unknown as AxiosInstance;
    const onProgress = vi.fn();

    const file = new File(["x"], "steady.bin", {
      type: "application/octet-stream",
    });
    const promise = uploadAttachments(apiClient, "42", [file], { onProgress });

    await Promise.resolve();
    const requestConfig = post.mock.calls[0][2] as {
      signal?: AbortSignal;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    };

    await vi.advanceTimersByTimeAsync(ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS - 1);
    expect(requestConfig.signal?.aborted).toBe(false);

    requestConfig.onUploadProgress?.({
      loaded: 2,
      total: 4,
    } as AxiosProgressEvent);
    expect(onProgress).toHaveBeenCalledWith(50);

    await vi.advanceTimersByTimeAsync(ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS - 1);
    expect(requestConfig.signal?.aborted).toBe(false);

    resolveRequest?.({ data: { id: 12, content: "", attachments: [] } });
    await expect(promise).resolves.toMatchObject({ id: 12 });
  });
});
