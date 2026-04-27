import { describe, expect, it } from "vitest";

import {
  buildChatTargetPath,
  buildDirectChatPath,
  buildPublicChatPath,
  isPrefixlessChatPath,
  isReservedChatTarget,
  normalizeChatTarget,
  parseChatTargetFromPathname,
} from "./chatTarget";

describe("chatTarget", () => {
  it("normalizes public, handle, and numeric targets", () => {
    expect(normalizeChatTarget(" public ")).toBe("public");
    expect(normalizeChatTarget("@Alice_Test")).toBe("@alice_test");
    expect(normalizeChatTarget("1234567890")).toBe("1234567890");
    expect(normalizeChatTarget("-1234567890")).toBe("-1234567890");
  });

  it("builds prefixless chat paths", () => {
    expect(buildPublicChatPath()).toBe("/public");
    expect(buildDirectChatPath("@Alice_Test")).toBe("/@alice_test");
    expect(buildChatTargetPath("-1234567890")).toBe("/-1234567890");
  });

  it("parses only valid single-segment chat paths", () => {
    expect(parseChatTargetFromPathname("/@alice")).toBe("@alice");
    expect(parseChatTargetFromPathname("/public")).toBe("public");
    expect(parseChatTargetFromPathname("/rooms/public")).toBeNull();
    expect(parseChatTargetFromPathname("/friends")).toBeNull();
  });

  it("keeps reserved top-level routes out of chat resolution", () => {
    expect(isReservedChatTarget("friends")).toBe(true);
    expect(isReservedChatTarget("rooms")).toBe(true);
    expect(isPrefixlessChatPath("/friends")).toBe(false);
    expect(isPrefixlessChatPath("/@alice")).toBe(true);
  });
});
