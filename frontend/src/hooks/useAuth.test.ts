import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateProfileRequestDto as UpdateProfileDto } from "../dto";
import type { UserProfile } from "../entities/user/types";

const authControllerMock = vi.hoisted(() => ({
  ensureCsrf: vi.fn<() => Promise<{ csrfToken: string }>>(),
  getSession: vi.fn<
    () => Promise<{
      authenticated: boolean;
      user: UserProfile | null;
      wsAuthToken: string | null;
      twoFactorRequired?: boolean;
    }>
  >(),
  login: vi.fn<
    (dto: { identifier: string; password: string }) => Promise<{
      authenticated: boolean;
      user: UserProfile | null;
      wsAuthToken: string | null;
      twoFactorRequired?: boolean;
    }>
  >(),
  confirmLoginTwoFactor: vi.fn<
    (dto: { code: string }) => Promise<{
      authenticated: boolean;
      user: UserProfile | null;
      wsAuthToken: string | null;
    }>
  >(),
  oauthGoogle: vi.fn<
    (
      token: string,
      tokenType?: "idToken" | "accessToken",
    ) => Promise<{
      authenticated: boolean;
      user: UserProfile | null;
      wsAuthToken: string | null;
    }>
  >(),
  register: vi.fn<
    (dto: {
      login: string;
      password: string;
      passwordConfirm: string;
      name: string;
      username?: string;
      email?: string;
    }) => Promise<{
      authenticated: boolean;
      user: UserProfile | null;
      wsAuthToken: string | null;
    }>
  >(),
  logout: vi.fn<() => Promise<{ ok: boolean }>>(),
  updateProfile:
    vi.fn<(dto: UpdateProfileDto) => Promise<{ user: UserProfile }>>(),
}));

vi.mock("../controllers/AuthController", () => ({
  authController: authControllerMock,
}));

import { useAuth } from "./useAuth";

const sessionUser = {
  name: "Demo",
  username: "demo",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

describe("useAuth", () => {
  /**
   * Выполняет метод `beforeEach`.
   * @returns Результат выполнения операции.
   */

  beforeEach(() => {
    authControllerMock.ensureCsrf
      .mockReset()
      .mockResolvedValue({ csrfToken: "token" });
    authControllerMock.getSession.mockReset().mockResolvedValue({
      authenticated: true,
      user: sessionUser,
      wsAuthToken: "auth-token",
    });
    authControllerMock.login.mockReset().mockResolvedValue({
      authenticated: true,
      user: sessionUser,
      wsAuthToken: "auth-token",
    });
    authControllerMock.confirmLoginTwoFactor.mockReset().mockResolvedValue({
      authenticated: true,
      user: sessionUser,
      wsAuthToken: "two-factor-token",
    });
    authControllerMock.oauthGoogle.mockReset().mockResolvedValue({
      authenticated: true,
      user: sessionUser,
      wsAuthToken: "auth-token",
    });
    authControllerMock.register.mockReset().mockResolvedValue({
      authenticated: true,
      user: sessionUser,
      wsAuthToken: "auth-token",
    });
    authControllerMock.logout.mockReset().mockResolvedValue({ ok: true });
    authControllerMock.updateProfile
      .mockReset()
      .mockResolvedValue({ user: { ...sessionUser, bio: "updated" } });
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("loads session on mount", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(authControllerMock.ensureCsrf).toHaveBeenCalledTimes(1);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(authControllerMock.getSession).toHaveBeenCalledTimes(1);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.auth.user?.username).toBe("demo");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("falls back to guest state when session request fails", async () => {
    authControllerMock.getSession.mockRejectedValueOnce(
      new Error("session failed"),
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.auth.loading).toBe(false));
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.auth.user).toBeNull();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("login and register refresh auth user", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    await act(async () => {
      await result.current.login({
        identifier: "demo_login",
        password: "pass12345",
      });
      await result.current.register({
        login: "demo_login",
        password: "pass12345",
        passwordConfirm: "pass12345",
        name: "Demo Login",
        username: undefined,
        email: undefined,
      });
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(authControllerMock.login).toHaveBeenCalledWith({
      identifier: "demo_login",
      password: "pass12345",
    });
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(authControllerMock.register).toHaveBeenCalledWith({
      login: "demo_login",
      password: "pass12345",
      passwordConfirm: "pass12345",
      name: "Demo Login",
      username: undefined,
      email: undefined,
    });
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.auth.user?.username).toBe("demo");
  });

  it("login waits for two-factor challenge before setting auth user", async () => {
    authControllerMock.getSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
      wsAuthToken: null,
    });
    authControllerMock.login.mockResolvedValueOnce({
      authenticated: false,
      user: null,
      wsAuthToken: null,
      twoFactorRequired: true,
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    let twoFactorRequired = false;
    await act(async () => {
      const session = await result.current.login({
        identifier: "demo_login",
        password: "pass12345",
      });
      twoFactorRequired = session.twoFactorRequired === true;
    });

    expect(twoFactorRequired).toBe(true);
    expect(result.current.auth.user).toBeNull();
    expect(result.current.auth.wsAuthToken).toBeNull();
  });

  it("confirmLoginTwoFactor completes auth state", async () => {
    authControllerMock.getSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
      wsAuthToken: null,
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    await act(async () => {
      await result.current.confirmLoginTwoFactor({ code: "123456" });
    });

    expect(authControllerMock.confirmLoginTwoFactor).toHaveBeenCalledWith({
      code: "123456",
    });
    expect(result.current.auth.user?.username).toBe("demo");
    expect(result.current.auth.wsAuthToken).toBe("two-factor-token");
  });

  it("google oauth login refreshes auth user", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    await act(async () => {
      await result.current.loginWithGoogle("id-token");
    });

    expect(authControllerMock.oauthGoogle).toHaveBeenCalledWith(
      "id-token",
      "idToken",
    );
    expect(result.current.auth.user?.username).toBe("demo");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("logout clears auth user even when api fails", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    authControllerMock.logout.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      await result.current.logout();
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.auth.user).toBeNull();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("updateProfile normalizes empty profile image", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    authControllerMock.updateProfile.mockResolvedValueOnce({
      user: {
        ...sessionUser,
        profileImage: "",
      },
    });

    await act(async () => {
      await result.current.updateProfile({ username: "demo" });
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.auth.user?.profileImage).toBeNull();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("updateProfile drops user on 401", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    authControllerMock.updateProfile.mockRejectedValueOnce({
      status: 401,
      message: "Unauthorized",
    });

    let thrown: unknown = null;
    await act(async () => {
      try {
        await result.current.updateProfile({ username: "demo" });
      } catch (error) {
        thrown = error;
      }
    });

    /**
     * Выполняет метод `expect`.
     * @param thrown Пойманное исключение.
     * @returns Результат выполнения операции.
     */

    expect(thrown).toMatchObject({ status: 401 });
    await waitFor(() => expect(result.current.auth.user).toBeNull());
  });
});
