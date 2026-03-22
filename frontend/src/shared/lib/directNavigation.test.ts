import { beforeEach, describe, expect, it } from "vitest";

import { parseChatTargetFromPathname } from "./chatTarget";
import {
  DIRECT_HOME_FALLBACK_PATH,
  rememberLastDirectRef,
  resolveRememberedDirectPath,
} from "./directNavigation";

describe("directNavigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("parses prefixless direct target from pathname", () => {
    expect(parseChatTargetFromPathname("/@alice")).toBe("@alice");
    expect(parseChatTargetFromPathname("/public")).toBe("public");
    expect(parseChatTargetFromPathname("/friends")).toBeNull();
  });

  it("prefers active direct pathname", () => {
    rememberLastDirectRef("bob");

    expect(
      resolveRememberedDirectPath({
        pathname: "/@alice",
        directPeerRefs: ["@alice", "charlie"],
      }),
    ).toBe("/@alice");
  });

  it("falls back to stored direct ref and then to friends", () => {
    expect(resolveRememberedDirectPath()).toBe(DIRECT_HOME_FALLBACK_PATH);

    rememberLastDirectRef("bob");
    expect(resolveRememberedDirectPath()).toBe("/@bob");
  });

  it("uses first known inbox peer when storage is empty", () => {
    expect(
      resolveRememberedDirectPath({
        directPeerRefs: ["", null, "alice"],
      }),
    ).toBe("/@alice");
  });
});
