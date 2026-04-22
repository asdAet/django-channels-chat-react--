import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const chatMock = vi.hoisted(() => ({
  resolveChatTarget: vi.fn<
    (target: string) => Promise<{ roomId: number; resolvedTarget: string }>
  >(),
  globalSearch: vi.fn<
    (query: string) => Promise<{
      users: Array<{
        username: string;
        profileImage: string | null;
        avatarCrop: null;
        lastSeen: null;
      }>;
      groups: Array<{
        roomId: number;
        name: string;
        description: string;
        publicRef: string;
        memberCount: number;
        isPublic: boolean;
      }>;
      messages: Array<{
        id: number;
        username: string;
        content: string;
        createdAt: string;
        roomId: number;
        roomName: string;
        roomKind: "public" | "private" | "direct" | "group";
      }>;
    }>
  >(),
}));

const groupMock = vi.hoisted(() => ({
  getMyGroups: vi.fn<
    () => Promise<{
      items: Array<{
        roomTarget: string;
        roomId: number;
        name: string;
        description: string;
        username: string | null;
        memberCount: number;
        avatarUrl?: string | null;
        avatarCrop?: null;
      }>;
      total: number;
    }>
  >(),
}));

const directInboxMock = vi.hoisted(() => ({
  items: [] as Array<never>,
  unreadCounts: {} as Record<string, number>,
  roomUnreadCounts: {} as Record<string, number>,
}));

vi.mock("../../controllers/ChatController", () => ({
  chatController: chatMock,
}));

vi.mock("../../controllers/GroupController", () => ({
  groupController: groupMock,
}));

vi.mock("../directInbox", () => ({
  useDirectInbox: () => directInboxMock,
}));

vi.mock("../presence", () => ({
  usePresence: () => ({
    online: [],
    status: "offline",
  }),
}));

vi.mock("../unreadOverrides/store", () => ({
  useUnreadOverrides: () => ({}),
  collectSettledUnreadOverrideRoomIds: () => [],
  clearUnreadOverridesForRooms: vi.fn(),
}));

import {
  ConversationListProvider,
  useConversationList,
} from "./ConversationListProvider";

const user = {
  username: "demo",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

/**
 * Проверяет состояние провайдера в тестовом окружении.
 */
function Probe() {
  const { serverItems, setSearchQuery } = useConversationList();
  const publicItem = serverItems.find((item) => item.isPublic);
  return (
    <div>
      <p data-testid="public-unread">{publicItem?.unreadCount ?? 0}</p>
      <button type="button" onClick={() => setSearchQuery("@a")}>
        short-handle
      </button>
      <button type="button" onClick={() => setSearchQuery("@ab")}>
        valid-handle
      </button>
    </div>
  );
}

describe("ConversationListProvider global search validation", () => {
  beforeEach(() => {
    chatMock.resolveChatTarget
      .mockReset()
      .mockResolvedValue({ roomId: 1, resolvedTarget: "public" });
    chatMock.globalSearch
      .mockReset()
      .mockResolvedValue({ users: [], groups: [], messages: [] });
    groupMock.getMyGroups
      .mockReset()
      .mockResolvedValue({ items: [], total: 0 });
    directInboxMock.items = [];
    directInboxMock.unreadCounts = {};
    directInboxMock.roomUnreadCounts = {};
  });

  it("does not call global search for too short @handle query", async () => {
    render(
      <ConversationListProvider user={user} ready>
        <Probe />
      </ConversationListProvider>,
    );

    await waitFor(() => {
      expect(chatMock.resolveChatTarget).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "short-handle" }));
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(chatMock.globalSearch).not.toHaveBeenCalled();
  });

  it("calls global search for valid @handle query", async () => {
    render(
      <ConversationListProvider user={user} ready>
        <Probe />
      </ConversationListProvider>,
    );

    await waitFor(() => {
      expect(chatMock.resolveChatTarget).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "valid-handle" }));
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(chatMock.globalSearch).toHaveBeenCalledWith("@ab");
    });
  });

  it("updates room unread badges from inbox websocket state without refetching", async () => {
    directInboxMock.roomUnreadCounts = { "1": 4 };

    const { rerender } = render(
      <ConversationListProvider user={user} ready>
        <Probe />
      </ConversationListProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-unread").textContent).toBe("4");
    });

    expect(chatMock.resolveChatTarget).toHaveBeenCalledTimes(1);
    expect(groupMock.getMyGroups).toHaveBeenCalledTimes(1);

    directInboxMock.roomUnreadCounts = { "1": 7 };
    rerender(
      <ConversationListProvider user={user} ready>
        <Probe />
      </ConversationListProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-unread").textContent).toBe("7");
    });

    expect(chatMock.resolveChatTarget).toHaveBeenCalledTimes(1);
    expect(groupMock.getMyGroups).toHaveBeenCalledTimes(1);
  });
});
