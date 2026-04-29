import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationProvider } from "../../shared/notifications";
import { SecuritySettingsSection } from "./SecuritySettingsSection";

const securityMock = vi.hoisted(() => ({
  twoFactorEnabled: false,
  changePassword: vi.fn(),
  beginTwoFactorSetup: vi.fn(),
  confirmTwoFactor: vi.fn(),
  disableTwoFactor: vi.fn(),
}));

vi.mock("../../shared/security/useSecuritySettings", () => ({
  useSecuritySettings: () => ({
    security: {
      email: null,
      emailVerified: false,
      hasPassword: true,
      oauthProviders: [],
      twoFactorEnabled: securityMock.twoFactorEnabled,
      twoFactorEnabledAt: null,
    },
    loading: false,
    error: null,
    reload: vi.fn(),
    changePassword: securityMock.changePassword,
    beginTwoFactorSetup: securityMock.beginTwoFactorSetup,
    confirmTwoFactor: securityMock.confirmTwoFactor,
    disableTwoFactor: securityMock.disableTwoFactor,
  }),
}));

const renderSection = () =>
  render(
    <NotificationProvider>
      <SecuritySettingsSection enabled />
    </NotificationProvider>,
  );

describe("SecuritySettingsSection", () => {
  beforeEach(() => {
    securityMock.twoFactorEnabled = false;
    securityMock.changePassword.mockResolvedValue({});
    securityMock.beginTwoFactorSetup.mockResolvedValue({
      manualKey: "ABCDEF",
      otpauthUri: "otpauth://totp/Devil:demo",
      qrSvg: "data:image/svg+xml;base64,PHN2Zy8+",
    });
    securityMock.confirmTwoFactor.mockResolvedValue({});
    securityMock.disableTwoFactor.mockResolvedValue({});
  });

  it("submits password change through modal", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Сменить пароль" }));
    fireEvent.change(screen.getByLabelText("Текущий пароль"), {
      target: { value: "oldpass123" },
    });
    fireEvent.change(screen.getByLabelText("Новый пароль"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Повторите новый пароль"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Сменить пароль" }).at(-1)!,
    );

    await waitFor(() =>
      expect(securityMock.changePassword).toHaveBeenCalledWith({
        oldPassword: "oldpass123",
        newPassword: "newpass123",
        newPasswordConfirm: "newpass123",
      }),
    );
  });

  it("starts TOTP setup and confirms a six-digit code", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Включить защиту" }));
    await screen.findByText("ABCDEF");
    fireEvent.change(
      screen.getByLabelText("Шестизначный код двухфакторной защиты"),
      {
        target: { value: "123456" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить" }));

    await waitFor(() =>
      expect(securityMock.confirmTwoFactor).toHaveBeenCalledWith({
        code: "123456",
      }),
    );
  });

  it("disables TOTP when protection is already enabled", async () => {
    securityMock.twoFactorEnabled = true;
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Отключить" }));
    fireEvent.change(
      screen.getByLabelText("Шестизначный код двухфакторной защиты"),
      {
        target: { value: "654321" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Отключить защиту" }));

    await waitFor(() =>
      expect(securityMock.disableTwoFactor).toHaveBeenCalledWith({
        code: "654321",
      }),
    );
  });
});
