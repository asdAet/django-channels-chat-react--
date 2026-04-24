import { describe, expect, it } from "vitest";

import {
  buildGoogleAuthRedirectUrl,
} from "./googleRedirect";

describe("startGoogleAuthRedirect", () => {
  it("builds backend start endpoint with encoded next path", () => {
    expect(buildGoogleAuthRedirectUrl("/register?invite=abc")).toBe(
      "/api/auth/oauth/google/start/?next=%2Fregister%3Finvite%3Dabc",
    );
  });

  it("falls back to /login for unsafe next values", () => {
    expect(buildGoogleAuthRedirectUrl("https://evil.example")).toBe(
      "/api/auth/oauth/google/start/?next=%2Flogin",
    );
  });
});
