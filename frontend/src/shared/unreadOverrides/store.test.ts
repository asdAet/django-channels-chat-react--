import { beforeEach, describe, expect, it } from "vitest";

import {
  collectSettledUnreadOverrideRoomIds,
  resetUnreadOverrides,
  setUnreadOverride,
} from "./store";

describe("unread override reconciliation", () => {
  beforeEach(() => {
    resetUnreadOverrides();
  });

  it("keeps local zero override while polled server snapshot is still stale", () => {
    setUnreadOverride({ roomId: "101", unreadCount: 0 });

    const settledRoomIds = collectSettledUnreadOverrideRoomIds({
      authoritativeRoomIds: ["101"],
      authoritativeCounts: { "101": 3 },
    });

    expect(settledRoomIds).toEqual([]);
  });

  it("clears local zero override after server confirms zero unread", () => {
    setUnreadOverride({ roomId: "101", unreadCount: 0 });

    const settledRoomIds = collectSettledUnreadOverrideRoomIds({
      authoritativeRoomIds: ["101"],
      authoritativeCounts: {},
    });

    expect(settledRoomIds).toEqual(["101"]);
  });

  it("clears optimistic positive override when server sends authoritative count", () => {
    setUnreadOverride({ roomId: "101", unreadCount: 4 });

    const settledRoomIds = collectSettledUnreadOverrideRoomIds({
      authoritativeRoomIds: ["101"],
      authoritativeCounts: { "101": 2 },
    });

    expect(settledRoomIds).toEqual(["101"]);
  });

  it("keeps local lower unread override while server snapshot is still higher", () => {
    setUnreadOverride({ roomId: "101", unreadCount: 2 });

    const settledRoomIds = collectSettledUnreadOverrideRoomIds({
      authoritativeRoomIds: ["101"],
      authoritativeCounts: { "101": 5 },
    });

    expect(settledRoomIds).toEqual([]);
  });
});
