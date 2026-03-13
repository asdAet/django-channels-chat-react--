import { describe, expect, it } from "vitest";

import {
  buildLoginRequestDto,
  buildRegisterRequestDto,
  decodeAuthErrorPayload,
  decodeProfileEnvelopeResponse,
  decodeSessionResponse,
} from "./auth";

describe("auth DTO decoders", () => {
  it("decodes session with user", () => {
    const decoded = decodeSessionResponse({
      authenticated: true,
      user: {
        name: "Alice",
        username: "alice",
        email: "alice@example.com",
        profileImage: null,
        avatarCrop: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        bio: "bio",
        lastSeen: null,
        registeredAt: null,
      },
    });

    expect(decoded.authenticated).toBe(true);
    expect(decoded.user?.name).toBe("Alice");
    expect(decoded.user?.username).toBe("alice");
    expect(decoded.user?.avatarCrop).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    });
  });

  it("decodes profile envelope with defaults", () => {
    const decoded = decodeProfileEnvelopeResponse({
      user: {
        username: null,
      },
    });

    expect(decoded.user).toEqual({
      name: "",
      username: "",
      email: "",
      profileImage: null,
      avatarCrop: null,
      bio: "",
      lastSeen: null,
      registeredAt: null,
    });
  });

  it("validates outgoing login payload", () => {
    expect(
      buildLoginRequestDto({ email: "  demo@example.com ", password: "pass" }),
    ).toEqual({
      email: "demo@example.com",
      password: "pass",
    });
  });

  it("validates outgoing register payload", () => {
    expect(
      buildRegisterRequestDto({
        email: "new@example.com",
        password1: "pass12345",
        password2: "pass12345",
      }),
    ).toEqual({
      email: "new@example.com",
      password1: "pass12345",
      password2: "pass12345",
    });
  });

  it("safely decodes auth error payload", () => {
    const decoded = decodeAuthErrorPayload({ errors: { email: ["taken"] } });
    expect(decoded?.errors?.email).toEqual(["taken"]);
  });
});
