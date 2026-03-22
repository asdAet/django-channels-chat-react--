import { describe, expect, it } from "vitest";

import { decodePublicRefParam, decodeRoomRefParam } from "./route";

describe("route input decoders", () => {
  it("validates room ref", () => {
    expect(decodeRoomRefParam("public")).toBe("public");
    expect(decodeRoomRefParam("123")).toBe("123");
    expect(decodeRoomRefParam("0")).toBeNull();
    expect(decodeRoomRefParam("bad target")).toBeNull();
  });

  it("normalizes public refs", () => {
    expect(decodePublicRefParam("@alice")).toBe("alice");
    expect(decodePublicRefParam("@@alice")).toBe("@alice");
    expect(decodePublicRefParam("@@@@")).toBe("@@@");
    expect(decodePublicRefParam("   ")).toBeNull();
  });
});
