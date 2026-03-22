import { describe, expect, it } from "vitest";

import {
  resolveIdentityHandle,
  resolveIdentityLabel,
} from "./userIdentity";

describe("userIdentity", () => {
  it("prefers display name and falls back to username, public ref and user id", () => {
    expect(
      resolveIdentityLabel({
        displayName: "Alice",
        username: "alice",
        publicRef: "1234567890",
        userId: 10,
      }),
    ).toBe("Alice");

    expect(
      resolveIdentityLabel({
        displayName: "   ",
        username: "alice",
        publicRef: "1234567890",
        userId: 10,
      }),
    ).toBe("alice");

    expect(
      resolveIdentityLabel({
        displayName: "   ",
        username: "   ",
        publicRef: "1234567890",
        userId: 10,
      }),
    ).toBe("1234567890");

    expect(
      resolveIdentityLabel({
        displayName: "   ",
        username: "   ",
        publicRef: "   ",
        userId: 10,
      }),
    ).toBe("10");
  });

  it("prefers a public handle for the secondary identity line", () => {
    expect(
      resolveIdentityHandle({
        publicRef: "alice",
        username: "legacy",
        userId: 10,
      }),
    ).toBe("@alice");

    expect(
      resolveIdentityHandle({
        publicRef: "   ",
        username: "alice",
        userId: 10,
      }),
    ).toBe("@alice");

    expect(
      resolveIdentityHandle({
        publicRef: "   ",
        username: "   ",
        userId: 10,
      }),
    ).toBe("10");
  });
});
