import { describe, expect, it } from "vitest";

import { buildGoogleAuthRedirectUrl } from "./googleRedirect";

describe("startGoogleAuthRedirect", () => {
  it("builds backend start endpoint with success and error return paths", () => {
    expect(
      buildGoogleAuthRedirectUrl("/public", {
        errorReturnTo: "/register?invite=abc",
      }),
    ).toBe(
      "/api/auth/oauth/google/start/?next=%2Fpublic&errorNext=%2Fregister%3Finvite%3Dabc",
    );
  });

  it("falls back to safe local paths for unsafe values", () => {
    expect(
      buildGoogleAuthRedirectUrl("/\\evil.example", {
        errorReturnTo: "https://evil.example",
      }),
    ).toBe(
      "/api/auth/oauth/google/start/?next=%2Fpublic&errorNext=%2Flogin",
    );
  });
});
