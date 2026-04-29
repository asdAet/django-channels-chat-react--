import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotificationProvider } from "../../shared/notifications";
import { LoginTwoFactorModal } from "./LoginTwoFactorModal";

const renderModal = (props?: Partial<Parameters<typeof LoginTwoFactorModal>[0]>) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn(async () => {});
  render(
    <NotificationProvider>
      <LoginTwoFactorModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </NotificationProvider>,
  );
  return { onClose, onConfirm };
};

describe("LoginTwoFactorModal", () => {
  it("submits a six digit code for login challenge", async () => {
    const { onConfirm, onClose } = renderModal();

    fireEvent.change(
      screen.getByLabelText("Шестизначный код двухфакторной защиты"),
      { target: { value: "12a3456" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("123456"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps submit disabled until code is complete", () => {
    renderModal();

    const submit = screen.getByRole("button", { name: "Войти" });
    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByLabelText("Шестизначный код двухфакторной защиты"),
      { target: { value: "12345" } },
    );
    expect(submit).toBeDisabled();
  });
});
