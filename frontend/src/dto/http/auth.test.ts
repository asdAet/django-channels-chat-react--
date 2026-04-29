import { describe, expect, it } from "vitest";

import {
  buildChangePasswordRequestDto,
  buildLoginRequestDto,
  buildOAuthGoogleRequestDto,
  buildRegisterRequestDto,
  buildTwoFactorLoginRequestDto,
  decodeAuthErrorPayload,
  decodeProfileEnvelopeResponse,
  decodeSecuritySettingsResponse,
  decodeSessionResponse,
  decodeTwoFactorSetupResponse,
} from "./auth";

describe("auth DTO decoders", () => {
  it("decodes session with user", () => {
    const decoded = decodeSessionResponse({
      authenticated: true,
      user: {
        name: "Alice",
        handle: "alice",
        publicRef: "@alice",
        publicId: "1234567890",
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
    expect(decoded.user?.publicRef).toBe("@alice");
    expect(decoded.user?.publicId).toBe("1234567890");
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
        publicRef: "",
      },
    });

    expect(decoded.user).toEqual({
      name: "",
      username: "",
      handle: null,
      publicRef: "",
      publicId: null,
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
      buildLoginRequestDto({
        identifier: "  demo_login ",
        password: "pass",
      }),
    ).toEqual({
      identifier: "demo_login",
      password: "pass",
    });
  });

  it("decodes two-factor login challenge session", () => {
    const decoded = decodeSessionResponse({
      authenticated: false,
      user: null,
      wsAuthToken: null,
      twoFactorRequired: true,
    });

    expect(decoded.twoFactorRequired).toBe(true);
    expect(decoded.user).toBeNull();
  });

  it("validates two-factor and password security payloads", () => {
    expect(buildTwoFactorLoginRequestDto({ code: " 123456 " })).toEqual({
      code: "123456",
    });
    expect(
      buildChangePasswordRequestDto({
        oldPassword: "old",
        newPassword: "newpass123",
        newPasswordConfirm: "newpass123",
      }),
    ).toEqual({
      oldPassword: "old",
      newPassword: "newpass123",
      newPasswordConfirm: "newpass123",
    });
  });

  it("decodes security settings and TOTP setup envelopes", () => {
    expect(
      decodeSecuritySettingsResponse({
        security: {
          hasPassword: true,
          twoFactorEnabled: true,
          twoFactorEnabledAt: "2026-04-28T00:00:00Z",
        },
      }),
    ).toEqual({
      security: {
        email: null,
        emailVerified: false,
        hasPassword: true,
        oauthProviders: [],
        twoFactorEnabled: true,
        twoFactorEnabledAt: "2026-04-28T00:00:00Z",
      },
    });
    expect(
      decodeTwoFactorSetupResponse({
        setup: {
          manualKey: "ABC",
          otpauthUri: "otpauth://totp/Devil:abc",
          qrSvg: "data:image/svg+xml;base64,abc",
        },
      }).setup.manualKey,
    ).toBe("ABC");
  });

  it("keeps username empty when only fallback publicId exists", () => {
    const decoded = decodeSessionResponse({
      authenticated: true,
      user: {
        name: "No Handle",
        publicId: "1234567890",
      },
    });

    expect(decoded.user?.username).toBe("");
    expect(decoded.user?.publicRef).toBe("1234567890");
  });

  it("maps superuser flag from session payload", () => {
    const decoded = decodeSessionResponse({
      authenticated: true,
      user: {
        handle: "admin",
        isSuperuser: true,
      },
    });

    expect(decoded.user?.isSuperuser).toBe(true);
  });

  it("validates outgoing register payload", () => {
    expect(
      buildRegisterRequestDto({
        login: "NEW_LOGIN",
        password: "pass12345",
        passwordConfirm: "pass12345",
        name: "New Login",
      }),
    ).toEqual({
      login: "new_login",
      password: "pass12345",
      passwordConfirm: "pass12345",
      name: "New Login",
      email: undefined,
      username: undefined,
    });
  });

  it("safely decodes auth error payload", () => {
    const decoded = decodeAuthErrorPayload({
      code: "email_taken",
      message: "Email already used",
      errors: { email: ["taken"] },
    });
    expect(decoded?.code).toBe("email_taken");
    expect(decoded?.message).toBe("Email already used");
    expect(decoded?.errors?.email).toEqual(["taken"]);
  });

  it("builds oauth request with idToken", () => {
    expect(
      buildOAuthGoogleRequestDto({
        idToken: " id-token ",
      }),
    ).toEqual({
      idToken: "id-token",
      accessToken: undefined,
      username: undefined,
    });
  });

  it("builds oauth request with accessToken", () => {
    expect(
      buildOAuthGoogleRequestDto({
        accessToken: " access-token ",
      }),
    ).toEqual({
      idToken: undefined,
      accessToken: "access-token",
      username: undefined,
    });
  });
});
