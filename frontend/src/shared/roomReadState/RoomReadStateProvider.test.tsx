import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Message } from "../../entities/message/types";
import { resetUnreadOverrides } from "../unreadOverrides/store";
import { RoomReadStateProvider } from "./RoomReadStateProvider";
import { useRoomReadController } from "./useRoomReadState";

const wrapper = ({ children }: { children: ReactNode }) => (
  <RoomReadStateProvider>{children}</RoomReadStateProvider>
);

const buildMessages = (ids: number[]): Message[] =>
  ids.map((id) => ({
    id,
    publicRef: "alice",
    username: "alice",
    displayName: "Alice",
    content: `message ${id}`,
    profilePic: null,
    avatarCrop: null,
    createdAt: `2026-04-29T00:00:${String(id).padStart(2, "0")}Z`,
    editedAt: null,
    isDeleted: false,
    replyTo: null,
    attachments: [],
    reactions: [],
  }));

describe("RoomReadStateProvider", () => {
  beforeEach(() => {
    resetUnreadOverrides();
  });

  it("keeps server snapshot uninitialized until room data is loaded", () => {
    const { result } = renderHook(() => useRoomReadController(), { wrapper });

    act(() => {
      result.current.applyServerUnreadSnapshot({ "1": 4 });
    });

    expect(result.current.getRoomState(1)?.initialized).toBe(false);
    expect(result.current.getRoomUnreadCount(1)).toBe(4);
  });

  it("initializes unread state and decreases it from viewport read progress", () => {
    const { result } = renderHook(() => useRoomReadController(), { wrapper });
    const messages = buildMessages([2, 3, 4, 5]);

    act(() => {
      result.current.initializeRoom({
        roomId: 1,
        serverLastReadMessageId: 1,
        messages,
        currentActorRef: "demo",
      });
    });

    expect(result.current.getRoomState(1)?.unreadCount).toBe(4);
    expect(result.current.getRoomState(1)?.firstUnreadMessageId).toBe(2);

    act(() => {
      result.current.applyLocalRead({
        roomId: 1,
        lastReadMessageId: 3,
        messages,
        currentActorRef: "demo",
      });
    });

    expect(result.current.getRoomState(1)?.unreadCount).toBe(2);
    expect(result.current.getRoomState(1)?.firstUnreadMessageId).toBe(4);
  });

  it("does not roll local progress back when a websocket snapshot is stale", () => {
    const { result } = renderHook(() => useRoomReadController(), { wrapper });
    const messages = buildMessages([2, 3, 4, 5, 6, 7]);

    act(() => {
      result.current.applyServerUnreadSnapshot({ "1": 6 });
      result.current.initializeRoom({
        roomId: 1,
        serverLastReadMessageId: 1,
        messages,
        currentActorRef: "demo",
      });
      result.current.applyLocalRead({
        roomId: 1,
        lastReadMessageId: 5,
        messages,
        currentActorRef: "demo",
      });
    });

    expect(result.current.getRoomState(1)?.unreadCount).toBe(2);

    act(() => {
      result.current.applyServerUnreadSnapshot({ "1": 5 });
    });

    expect(result.current.getRoomState(1)?.unreadCount).toBe(2);
  });

  it("clears unread divider and pending read when the room becomes fully read", () => {
    const { result } = renderHook(() => useRoomReadController(), { wrapper });
    const messages = buildMessages([2, 3]);

    act(() => {
      result.current.initializeRoom({
        roomId: 1,
        serverLastReadMessageId: 1,
        messages,
        currentActorRef: "demo",
      });
      result.current.setRoomDivider(1, 2);
      result.current.setPendingMarkRead(1, 3);
      result.current.applyLocalRead({
        roomId: 1,
        lastReadMessageId: 3,
        messages,
        currentActorRef: "demo",
      });
      result.current.acknowledgeServerRead(1, 3);
    });

    const state = result.current.getRoomState(1);
    expect(state?.unreadCount).toBe(0);
    expect(state?.dividerMessageId).toBeNull();
    expect(state?.pendingMarkReadMessageId).toBeNull();
  });
});
