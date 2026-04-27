import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "../entities/user/types";

const controllerMock = vi.hoisted(() => ({
  resolveChatTarget: vi.fn(),
}));

vi.mock("../controllers/ChatController", () => ({
  chatController: controllerMock,
}));

vi.mock("./ChatRoomPage", () => ({
  ChatRoomPage: ({ roomId }: { roomId: string }) => <div>CHAT_ROOM:{roomId}</div>,
}));

import { ChatTargetPage } from "./ChatTargetPage";

const user: UserProfile = {
  username: "demo",
  publicRef: "@demo",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

describe("ChatTargetPage", () => {
  beforeEach(() => {
    controllerMock.resolveChatTarget.mockReset();
    window.localStorage.clear();
  });

  it("resolves direct target and remembers last direct ref", async () => {
    controllerMock.resolveChatTarget.mockResolvedValue({
      targetKind: "direct",
      roomId: 55,
      roomKind: "direct",
      resolvedTarget: "@alice",
      peer: {
        userId: 2,
        publicRef: "@alice",
        username: "alice",
        displayName: "Alice",
        profileImage: null,
        avatarCrop: null,
        lastSeen: null,
        bio: "",
        blocked: false,
      },
    });

    render(<ChatTargetPage user={user} target="@alice" onNavigate={vi.fn()} />);

    expect(await screen.findByText("CHAT_ROOM:55")).toBeInTheDocument();
    expect(controllerMock.resolveChatTarget).toHaveBeenCalledWith("@alice");
    expect(window.localStorage.getItem("ui.direct.last-ref")).toBe("@alice");
  });

  it("renders public room with stable public target", async () => {
    controllerMock.resolveChatTarget.mockResolvedValue({
      targetKind: "public",
      roomId: 1,
      roomKind: "public",
      resolvedTarget: "public",
      room: {
        roomId: 1,
        name: "Публичный чат",
        kind: "public",
      },
    });

    render(<ChatTargetPage user={user} target="public" onNavigate={vi.fn()} />);

    expect(await screen.findByText("CHAT_ROOM:1")).toBeInTheDocument();
  });

  it("renders group room using numeric room id", async () => {
    controllerMock.resolveChatTarget.mockResolvedValue({
      targetKind: "group",
      roomId: 88,
      roomKind: "group",
      resolvedTarget: "@crew",
      room: {
        roomId: 88,
        name: "Crew",
        kind: "group",
      },
    });

    render(<ChatTargetPage user={user} target="@crew" onNavigate={vi.fn()} />);

    expect(await screen.findByText("CHAT_ROOM:88")).toBeInTheDocument();
  });

  it("shows not-found error and navigates back to friends", async () => {
    const onNavigate = vi.fn();
    controllerMock.resolveChatTarget.mockRejectedValue({ status: 404 });

    render(<ChatTargetPage user={user} target="@missing" onNavigate={onNavigate} />);

    expect(await screen.findByText("Чат не найден")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "К друзьям" }));
    expect(onNavigate).toHaveBeenCalledWith("/friends");
  });

  it("maps auth and validation errors to stable user messages", async () => {
    const cases = [
      { status: 400, text: "Нельзя открыть чат с этим адресом" },
      { status: 401, text: "Нужна авторизация" },
      { status: 403, text: "Доступ запрещен" },
    ];

    for (const item of cases) {
      controllerMock.resolveChatTarget.mockRejectedValueOnce({ status: item.status });
      const { unmount } = render(
        <ChatTargetPage user={user} target={`case-${item.status}`} onNavigate={vi.fn()} />,
      );
      await waitFor(() => {
        expect(screen.getByText(item.text)).toBeInTheDocument();
      });
      unmount();
    }
  });
});
