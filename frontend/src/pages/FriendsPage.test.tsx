import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const friendsHookMock = vi.hoisted(() => ({
  friends: [] as Array<{
    id: number;
    userId: number;
    publicRef: string;
    username: string;
    displayName?: string;
    profileImage: string | null;
    avatarCrop?: null;
    lastSeen: string | null;
  }>,
  incoming: [] as Array<{
    id: number;
    userId: number;
    publicRef: string;
    username: string;
    displayName?: string;
    profileImage?: string | null;
    avatarCrop?: null;
    createdAt: string;
  }>,
  outgoing: [] as Array<{
    id: number;
    userId: number;
    publicRef: string;
    username: string;
    displayName?: string;
    profileImage?: string | null;
    avatarCrop?: null;
    createdAt: string;
  }>,
  blocked: [] as Array<{
    id: number;
    userId: number;
    publicRef: string;
    username: string;
    displayName?: string;
    profileImage?: string | null;
    avatarCrop?: null;
  }>,
  infoMessage: null as string | null,
  loading: false,
  error: null as string | null,
  clearInfoMessage: vi.fn(),
  reload: vi.fn(),
  sendRequest: vi.fn(async () => undefined),
  acceptRequest: vi.fn(async () => undefined),
  declineRequest: vi.fn(async () => undefined),
  cancelOutgoingRequest: vi.fn(async () => undefined),
  removeFriend: vi.fn(async () => undefined),
  blockUser: vi.fn(async () => undefined),
  unblockUser: vi.fn(async () => undefined),
}));

const presenceMock = vi.hoisted(() => ({
  online: [] as Array<{
    publicRef: string;
    username: string;
    profileImage: string | null;
  }>,
  guests: 0,
  status: "online" as const,
  lastError: null as string | null,
}));

vi.mock("../hooks/useFriends", () => ({
  useFriends: () => friendsHookMock,
}));

vi.mock("../shared/presence", () => ({
  usePresence: () => presenceMock,
}));

import { FriendsPage } from "./FriendsPage";

const user = {
  publicRef: "demo",
  username: "demo",
  name: "Demo",
  email: "demo@example.com",
  profileImage: null,
  avatarCrop: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

describe("FriendsPage", () => {
  beforeEach(() => {
    friendsHookMock.friends = [];
    friendsHookMock.incoming = [];
    friendsHookMock.outgoing = [];
    friendsHookMock.blocked = [];
    friendsHookMock.infoMessage = null;
    friendsHookMock.loading = false;
    friendsHookMock.error = null;
    presenceMock.online = [];
    presenceMock.status = "online";
    friendsHookMock.clearInfoMessage.mockReset();
    friendsHookMock.sendRequest.mockClear();
  });

  it("shows auth prompt for guests", () => {
    render(<FriendsPage user={null} onNavigate={vi.fn()} />);

    expect(screen.getByText("Авторизуйтесь")).toBeInTheDocument();
  });

  it("filters friends in the active tab", () => {
    friendsHookMock.friends = [
      {
        id: 1,
        userId: 10,
        publicRef: "alice",
        username: "alice",
        displayName: "Alice",
        profileImage: null,
        avatarCrop: null,
        lastSeen: null,
      },
      {
        id: 2,
        userId: 11,
        publicRef: "bob",
        username: "bob",
        displayName: "Bob",
        profileImage: null,
        avatarCrop: null,
        lastSeen: null,
      },
    ];

    render(<FriendsPage user={user} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "ali" },
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("opens add-friend dialog from toolbar action", () => {
    render(<FriendsPage user={user} onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить друга" }));

    expect(
      screen.getByRole("dialog", { name: "Добавить друга" }),
    ).toBeInTheDocument();
  });

  it("falls back to public ref for the friend label and still renders the avatar image", () => {
    friendsHookMock.friends = [
      {
        id: 1,
        userId: 10,
        publicRef: "1234567890",
        username: "   ",
        displayName: "   ",
        profileImage: "https://cdn.example.com/alice.jpg",
        avatarCrop: null,
        lastSeen: null,
      },
    ];

    render(<FriendsPage user={user} onNavigate={vi.fn()} />);

    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "1234567890" }),
    ).toBeInTheDocument();
  });
});