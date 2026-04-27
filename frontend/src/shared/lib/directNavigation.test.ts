import { beforeEach, describe, expect, it } from "vitest";

import { parseChatTargetFromPathname } from "./chatTarget";
import {
  DIRECT_HOME_FALLBACK_PATH,
  LAST_DIRECT_REF_STORAGE_KEY,
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

  it("falls back to friends when there is no current direct inbox", () => {
    expect(resolveRememberedDirectPath()).toBe(DIRECT_HOME_FALLBACK_PATH);

    rememberLastDirectRef("bob");
    expect(resolveRememberedDirectPath()).toBe(DIRECT_HOME_FALLBACK_PATH);
  });

  it("uses stored direct ref only when it is present in current inbox", () => {
    rememberLastDirectRef("bob");

    expect(
      resolveRememberedDirectPath({
        directPeerRefs: ["alice", "bob"],
      }),
    ).toBe("/@bob");
  });

  it("drops stale stored direct ref and uses current inbox instead", () => {
    rememberLastDirectRef("mallory");

    expect(
      resolveRememberedDirectPath({
        directPeerRefs: ["alice"],
      }),
    ).toBe("/@alice");
    expect(window.localStorage.getItem(LAST_DIRECT_REF_STORAGE_KEY)).toBeNull();
  });

  it("uses first known inbox peer when storage is empty", () => {
    expect(
      resolveRememberedDirectPath({
        directPeerRefs: ["", null, "alice"],
      }),
    ).toBe("/@alice");
  });
});
