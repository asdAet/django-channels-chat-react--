import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "../../entities/user/types";
import { Sidebar } from "./Sidebar";

const directInboxMock = vi.hoisted(() => ({
  unreadDialogsCount: 2,
  unreadCounts: { "1": 2 },
  roomUnreadCounts: { "1": 2 },
  items: [
    {
      roomId: 1,
      peer: {
        publicRef: "alice",
        username: "alice",
        displayName: "Alice",
        profileImage: null,
        avatarCrop: null,
      },
      lastMessage: "hello",
      lastMessageAt: "2026-03-21T12:00:00Z",
    },
  ],
}));

const conversationListMock = vi.hoisted(() => ({
  searchQuery: "",
  setSearchQuery: vi.fn(),
  refresh: vi.fn(),
  serverItems: [
    {
      key: "public",
      roomId: 99,
      roomTarget: "public",
      name: "Публичный чат",
      path: "/public",
      avatarUrl: null,
      avatarCrop: null,
      unreadCount: 1,
      isPublic: true,
    },
  ],
}));

vi.mock("../../shared/directInbox", () => ({
  useDirectInbox: () => directInboxMock,
}));

vi.mock("../../shared/conversationList/ConversationListProvider", () => ({
  useConversationList: () => conversationListMock,
}));

const user: UserProfile = {
  name: "Demo",
  publicRef: "demo",
  username: "demo",
  email: "demo@example.com",
  profileImage: null,
  avatarCrop: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

describe("Sidebar", () => {
  beforeEach(() => {
    conversationListMock.searchQuery = "";
    conversationListMock.setSearchQuery.mockReset();
    conversationListMock.refresh.mockReset();
    window.localStorage.clear();
    document.documentElement.style.removeProperty("--tg-sidebar-w");
  });

  it("navigates to remembered direct when logo button clicked", () => {
    const onNavigate = vi.fn();
    window.localStorage.setItem("ui.direct.last-ref", "alice");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar user={user} onNavigate={onNavigate} onLogout={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("sidebar-logo-button"));
    expect(onNavigate).toHaveBeenCalledWith("/@alice");
  });

  it("falls back to first direct chat when there is no remembered direct", () => {
    const onNavigate = vi.fn();

    render(
      <MemoryRouter initialEntries={["/friends"]}>
        <Sidebar user={user} onNavigate={onNavigate} onLogout={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("sidebar-logo-button"));
    expect(onNavigate).toHaveBeenCalledWith("/@alice");
  });

  it("shows shortcut section with divider and navigates to friends/public chat", () => {
    const onNavigate = vi.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar user={user} onNavigate={onNavigate} onLogout={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("friends-divider")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("friends-nav-button"));
    expect(onNavigate).toHaveBeenCalledWith("/friends");
    fireEvent.click(screen.getByTestId("public-chat-nav-button"));
    expect(onNavigate).toHaveBeenCalledWith("/public");
  });

  it("opens settings modal from footer button", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar user={user} onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("sidebar-settings-button"));
    expect(screen.getByText("Опасная зона")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выйти из аккаунта" })).toBeInTheDocument();
  });

  it("falls back to /profile when publicRef is empty", () => {
    const onNavigate = vi.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar
          user={{ ...user, username: "   ", publicRef: "   " }}
          onNavigate={onNavigate}
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Demo/ }));
    expect(onNavigate).toHaveBeenCalledWith("/profile");
  });

  it("updates sidebar width and persists it while resizing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar user={user} onNavigate={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>,
    );

    const sidebar = container.querySelector("aside");
    expect(sidebar).not.toBeNull();
    if (!sidebar) return;

    Object.defineProperty(sidebar, "getBoundingClientRect", {
      value: () => ({
        width: 360,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 360,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    fireEvent.mouseDown(
      screen.getByRole("separator", {
        name: "Изменить ширину боковой панели",
      }),
      { clientX: 100 },
    );
    fireEvent.mouseMove(window, { clientX: 180 });
    fireEvent.mouseUp(window);

    expect(document.documentElement.style.getPropertyValue("--tg-sidebar-w")).toBe(
      "440px",
    );
    expect(window.localStorage.getItem("ui.sidebar.width")).toBe("440");
  });

  it("renders the mobile close control for CSS-only visibility", () => {
    const onCloseMobileDrawer = vi.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar
          user={user}
          onNavigate={vi.fn()}
          onLogout={vi.fn()}
          onCloseMobileDrawer={onCloseMobileDrawer}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("sidebar-mobile-close"));
    expect(onCloseMobileDrawer).toHaveBeenCalledTimes(1);
  });
});
