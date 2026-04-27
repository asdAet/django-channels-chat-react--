import { describe, expect, it } from "vitest";

import {
  decodeDirectChatsResponse,
  decodeMessageReadersResponse,
  decodeRoomMessagesResponse,
} from "./chat";

describe("chat HTTP DTO decoders", () => {
  it("decodes room messages response", () => {
    const decoded = decodeRoomMessagesResponse({
      messages: [
        {
          id: 1,
          publicRef: "alice",
          username: "alice",
          content: "hi",
          profilePic: null,
          avatarCrop: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          createdAt: "2026-02-18T00:00:00Z",
        },
      ],
      pagination: { limit: 50, hasMore: false, nextBefore: null },
    });

    expect(decoded.messages).toHaveLength(1);
    expect(decoded.messages[0]?.avatarCrop).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    });
    expect(decoded.pagination?.limit).toBe(50);
  });

  it("decodes direct chats response", () => {
    const decoded = decodeDirectChatsResponse({
      items: [
        {
          roomId: 123,
          peer: { publicRef: "bob", username: "bob", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-18T00:00:00Z",
        },
      ],
    });

    expect(decoded.items[0]?.roomId).toBe(123);
    expect(decoded.items[0]?.peer.publicRef).toBe("bob");
  });

  it("decodes message readers response with avatar fields", () => {
    const decoded = decodeMessageReadersResponse({
      roomKind: "group",
      messageId: 7,
      readers: [
        {
          userId: 2,
          publicRef: "alice",
          username: "alice",
          displayName: "Alice",
          profileImage: "https://cdn.example.com/alice.jpg",
          avatarCrop: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          readAt: "2026-02-18T00:00:00Z",
        },
      ],
    });

    expect(decoded.readers[0]?.profileImage).toBe(
      "https://cdn.example.com/alice.jpg",
    );
    expect(decoded.readers[0]?.avatarCrop).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    });
  });
});
