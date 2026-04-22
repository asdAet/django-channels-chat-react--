import { describe, expect, it } from "vitest";

import { decodeDirectInboxWsEvent } from "./directInbox";

describe("direct inbox WS DTO decoder", () => {
  it("normalizes unread state with fallback counts", () => {
    const decoded = decodeDirectInboxWsEvent(
      JSON.stringify({
        type: "direct_unread_state",
        unread: { roomIds: [1] },
      }),
    );

    expect(decoded.type).toBe("direct_unread_state");
    if (decoded.type === "direct_unread_state") {
      expect(decoded.unread.counts).toEqual({ 1: 1 });
      expect(decoded.unread.dialogs).toBe(1);
    }
  });

  it("decodes inbox item event", () => {
    const decoded = decodeDirectInboxWsEvent(
      JSON.stringify({
        type: "direct_inbox_item",
        item: {
          roomId: 1,
          peer: {
            publicRef: "alice",
            username: "alice",
            profileImage: null,
            avatarCrop: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          },
          lastMessage: "hey",
          lastMessageAt: "2026-02-18T00:00:00Z",
        },
      }),
    );

    expect(decoded.type).toBe("direct_inbox_item");
    if (decoded.type === "direct_inbox_item") {
      expect(decoded.item?.peer.publicRef).toBe("alice");
      expect(decoded.item?.peer.username).toBe("alice");
      expect(decoded.item?.peer.avatarCrop).toEqual({
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
      });
    }
  });

  it("decodes authoritative room unread state", () => {
    const decoded = decodeDirectInboxWsEvent(
      JSON.stringify({
        type: "room_unread_state",
        unread: {
          dialogs: 2,
          roomIds: [1, 2],
          counts: { "1": 4, "2": "1" },
        },
      }),
    );

    expect(decoded.type).toBe("room_unread_state");
    if (decoded.type === "room_unread_state") {
      expect(decoded.unread.dialogs).toBe(2);
      expect(decoded.unread.roomIds).toEqual(["1", "2"]);
      expect(decoded.unread.counts).toEqual({ "1": 4, "2": 1 });
    }
  });

  it("returns unknown for invalid payload", () => {
    expect(decodeDirectInboxWsEvent("[]").type).toBe("unknown");
  });
});
