import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";

const conversationListMock = vi.hoisted(() => ({
  searchQuery: "",
  setSearchQuery: vi.fn(),
  refresh: vi.fn(),
  serverItems: [
    {
      key: "public",
      roomId: 99,
      roomTarget: "public",
      name: "Public",
      path: "/public",
      avatarUrl: null,
      avatarCrop: null,
      unreadCount: 3,
      isPublic: true,
    },
  ],
}));

const directInboxMock = vi.hoisted(() => ({
  unreadDialogsCount: 5,
}));

vi.mock("../../shared/conversationList/ConversationListProvider", () => ({
  ConversationListProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  useConversationList: () => conversationListMock,
}));

vi.mock("../../shared/directInbox", () => ({
  useDirectInbox: () => directInboxMock,
}));

vi.mock("../../shared/layout/useInfoPanel", () => ({
  InfoPanelProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useInfoPanel: () => ({ isOpen: false }),
}));

vi.mock("./Sidebar", () => ({
  Sidebar: ({
    onNavigate,
    onCloseMobileDrawer,
  }: {
    onNavigate: (path: string) => void;
    onCloseMobileDrawer?: () => void;
  }) => (
    <aside data-testid="mock-sidebar">
      <button
        type="button"
        onClick={() => onNavigate("/friends")}
        data-testid="mock-sidebar-friends"
      >
        Friends
      </button>
      {onCloseMobileDrawer && (
        <button
          type="button"
          onClick={onCloseMobileDrawer}
          data-testid="mock-sidebar-close"
        >
          Close
        </button>
      )}
    </aside>
  ),
}));

vi.mock("./InfoPanel", () => ({
  InfoPanel: () => <div data-testid="info-panel" />,
}));

const user = {
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

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    writable: true,
    configurable: true,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};

function ShellHarness() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell
      user={user}
      onNavigate={(path) => navigate(path)}
      onLogout={vi.fn()}
      banner={null}
      error={null}
      isAuthRoute={false}
    >
      <div data-testid="route-value">{location.pathname}</div>
    </AppShell>
  );
}

describe("AppShell mobile navigation", () => {
  beforeEach(() => {
    setViewport(1280);
  });

  it("opens the sidebar drawer from the home header button on mobile", () => {
    setViewport(390);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ShellHarness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("app-shell-mobile-back"));

    expect(screen.getByTestId("route-value")).toHaveTextContent("/");
    expect(screen.getByTestId("app-shell-sidebar-pane")).toHaveAttribute(
      "data-mobile-drawer-open",
      "true",
    );
  });

  it("opens the mobile drawer from back button on friends and closes it after sidebar navigation", async () => {
    setViewport(390);
    render(
      <MemoryRouter initialEntries={["/friends"]}>
        <ShellHarness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("app-shell-mobile-back"));
    expect(screen.getByTestId("app-shell-sidebar-pane")).toHaveAttribute(
      "data-mobile-drawer-open",
      "true",
    );

    fireEvent.click(screen.getByTestId("mock-sidebar-friends"));

    await waitFor(() => {
      expect(screen.getByTestId("route-value")).toHaveTextContent("/friends");
    });
    expect(screen.getByTestId("app-shell-sidebar-pane")).toHaveAttribute(
      "data-mobile-drawer-open",
      "false",
    );
  });

  it("does not render the mobile header on desktop widths", () => {
    render(
      <MemoryRouter initialEntries={["/friends"]}>
        <ShellHarness />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("app-shell-mobile-back")).toBeNull();
    expect(screen.queryByTestId("app-shell-sidebar-backdrop")).toBeNull();
  });

  it("opens the sidebar drawer instead of navigating back from friends on mobile", () => {
    setViewport(390);
    render(
      <MemoryRouter initialEntries={["/", "/friends"]} initialIndex={1}>
        <ShellHarness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("app-shell-mobile-back"));

    expect(screen.getByTestId("route-value")).toHaveTextContent("/friends");
    expect(screen.getByTestId("app-shell-sidebar-pane")).toHaveAttribute(
      "data-mobile-drawer-open",
      "true",
    );
  });
});

