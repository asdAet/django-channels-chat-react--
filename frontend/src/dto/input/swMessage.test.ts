import { describe, expect, it } from "vitest";

import { decodeSwCacheMessage, encodeSwCacheMessage } from "./swMessage";

describe("service worker message DTO", () => {
  it("encodes valid invalidate payload", () => {
    const encoded = encodeSwCacheMessage({
      type: "invalidate",
      key: "roomMessages",
      roomRef: "public",
    });
    expect(encoded).toEqual({
      type: "invalidate",
      key: "roomMessages",
      roomRef: "public",
    });
  });

  it("decodes valid clear payload", () => {
    expect(decodeSwCacheMessage({ type: "clearUserCaches" })).toEqual({
      type: "clearUserCaches",
    });
  });

  it("rejects invalid payload shape", () => {
    expect(
      decodeSwCacheMessage({ type: "invalidate", key: "userProfile" }),
    ).toBeNull();
  });
});
