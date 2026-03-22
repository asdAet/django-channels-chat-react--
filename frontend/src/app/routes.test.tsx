import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../pages/HomePage", () => ({
  HomePage: () => <div>HOME_PAGE</div>,
}));

vi.mock("../pages/LoginPage", () => ({
  LoginPage: () => <div>LOGIN_PAGE</div>,
}));

vi.mock("../pages/RegisterPage", () => ({
  RegisterPage: () => <div>REGISTER_PAGE</div>,
}));

vi.mock("../pages/ProfilePage", () => ({
  ProfilePage: () => <div>PROFILE_PAGE</div>,
}));

vi.mock("../pages/SettingsPage", () => ({
  SettingsPage: () => <div>SETTINGS_PAGE</div>,
}));

vi.mock("../pages/FriendsPage", () => ({
  FriendsPage: () => <div>FRIENDS_PAGE</div>,
}));

vi.mock("../pages/GroupsPage", () => ({
  GroupsPage: () => <div>GROUPS_PAGE</div>,
}));

vi.mock("../pages/InvitePreviewPage", () => ({
  InvitePreviewPage: ({ code }: { code: string }) => <div>INVITE_PAGE:{code}</div>,
}));

vi.mock("../pages/UserProfilePage", () => ({
  UserProfilePage: ({ username }: { username: string }) => (
    <div>USER_PAGE:{username}</div>
  ),
}));

vi.mock("../pages/ChatTargetPage", () => ({
  ChatTargetPage: ({ target }: { target: string }) => (
    <div>CHAT_TARGET_PAGE:{target}</div>
  ),
}));

vi.mock("../pages/NotFoundPage", () => ({
  NotFoundPage: () => <div>NOT_FOUND_PAGE</div>,
}));

import { AppRoutes } from "./routes";

const handlers = {
  onNavigate: vi.fn(),
  onLogin: vi.fn(async () => {}),
  onGoogleOAuth: vi.fn(async () => {}),
  onRegister: vi.fn(async () => {}),
  onLogout: vi.fn(async () => {}),
  onProfileSave: vi.fn(async () => ({ ok: true as const })),
};

describe("AppRoutes", () => {
  it("renders login route", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("renders register route", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("REGISTER_PAGE")).toBeInTheDocument();
  });

  it("renders prefixless direct target route", () => {
    render(
      <MemoryRouter initialEntries={["/@alice"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("CHAT_TARGET_PAGE:@alice")).toBeInTheDocument();
  });

  it("renders public chat route through chat target page", () => {
    render(
      <MemoryRouter initialEntries={["/public"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("CHAT_TARGET_PAGE:public")).toBeInTheDocument();
  });

  it("keeps reserved routes above catch-all target route", () => {
    render(
      <MemoryRouter initialEntries={["/friends"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("FRIENDS_PAGE")).toBeInTheDocument();
  });

  it("normalizes user profile route by trimming one leading @", () => {
    render(
      <MemoryRouter initialEntries={["/users/%40%40%40%40"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("USER_PAGE:@@@")).toBeInTheDocument();
  });

  it("treats removed legacy /direct route as not found", () => {
    render(
      <MemoryRouter initialEntries={["/direct"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("NOT_FOUND_PAGE")).toBeInTheDocument();
  });

  it("renders not found for deep unmatched paths", () => {
    render(
      <MemoryRouter initialEntries={["/some/deep/path"]}>
        <AppRoutes
          user={null}
          error={null}
          passwordRules={[]}
          googleAuthDisabledReason={null}
          {...handlers}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("NOT_FOUND_PAGE")).toBeInTheDocument();
  });
});
