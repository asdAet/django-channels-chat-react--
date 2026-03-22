import { describe, expect, it } from "vitest";

import { decodeClientConfigResponse } from "./meta";

describe("dto/http/meta", () => {
  it("decodes valid client config payload", () => {
    const decoded = decodeClientConfigResponse({
      usernameMaxLength: 30,
      chatMessageMaxLength: 1000,
      chatTargetRegex: "^[A-Za-z0-9_-]{3,50}$",
      chatAttachmentMaxSizeMb: 10,
      chatAttachmentMaxPerMessage: 5,
      chatAttachmentAllowedTypes: ["audio/mpeg", "text/plain"],
      mediaUrlTtlSeconds: 300,
      mediaMode: "signed_only",
      googleOAuthClientId: "google-client-id",
      extra: true,
    });

    expect(decoded.usernameMaxLength).toBe(30);
    expect(decoded.mediaMode).toBe("signed_only");
    expect(decoded.chatAttachmentMaxSizeMb).toBe(10);
    expect(decoded.googleOAuthClientId).toBe("google-client-id");
  });

  it("throws for invalid payload", () => {
    expect(() =>
      decodeClientConfigResponse({ usernameMaxLength: 0 }),
    ).toThrow();
  });
});
