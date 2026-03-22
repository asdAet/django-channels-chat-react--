import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { uploadAttachments } from "./uploadAttachments";

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
});
