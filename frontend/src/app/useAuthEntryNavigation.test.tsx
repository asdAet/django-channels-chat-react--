import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authController } from "../controllers/AuthController";
import type { SessionResponseDto } from "../dto";
import type { UserProfile } from "../entities/user/types";
import {
  AUTH_ENTRY_LOGIN_PATH,
  resolveAuthEntryPath,
  useAuthEntryNavigation,
} from "./useAuthEntryNavigation";

vi.mock("../controllers/AuthController", () => ({
  authController: {
    getSession: vi.fn(),
  },
}));

vi.mock("../shared/lib/debug", () => ({
  debugLog: vi.fn(),
}));

const user: UserProfile = {
  username: "demo",
  publicRef: "demo",
  publicId: "1",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

const buildSession = (
  authenticated: boolean,
  sessionUser: UserProfile | null,
): SessionResponseDto => ({
  authenticated,
  user: sessionUser,
  wsAuthToken: authenticated ? "ws-token" : null,
});

function Harness({ onNavigate }: { onNavigate: (path: string) => void }) {
  const navigateToAuthEntry = useAuthEntryNavigation(onNavigate);

  return (
    <button type="button" onClick={navigateToAuthEntry}>
      entry
    </button>
  );
}

describe("useAuthEntryNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves authenticated sessions to the public chat", () => {
    expect(resolveAuthEntryPath(buildSession(true, user))).toBe("/public");
  });

  it("resolves guest sessions to login", () => {
    expect(resolveAuthEntryPath(buildSession(false, null))).toBe(
      AUTH_ENTRY_LOGIN_PATH,
    );
  });

  it("navigates authenticated promo users directly to the public chat", async () => {
    vi.mocked(authController.getSession).mockResolvedValue(
      buildSession(true, user),
    );
    const onNavigate = vi.fn();

    render(<Harness onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "entry" }));

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("/public"));
  });

  it("navigates guests to login", async () => {
    vi.mocked(authController.getSession).mockResolvedValue(
      buildSession(false, null),
    );
    const onNavigate = vi.fn();

    render(<Harness onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "entry" }));

    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(AUTH_ENTRY_LOGIN_PATH),
    );
  });

  it("falls back to login when the session check fails", async () => {
    vi.mocked(authController.getSession).mockRejectedValue(new Error("offline"));
    const onNavigate = vi.fn();

    render(<Harness onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "entry" }));

    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(AUTH_ENTRY_LOGIN_PATH),
    );
  });
});
