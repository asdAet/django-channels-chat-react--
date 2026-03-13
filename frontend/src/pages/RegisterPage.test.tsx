import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RegisterPage } from "./RegisterPage";

describe("RegisterPage", () => {
  it("submits registration payload with confirmation", () => {
    const onSubmit = vi.fn();
    render(
      <RegisterPage
        onSubmit={onSubmit}
        onNavigate={vi.fn()}
        passwordRules={["rule"]}
      />,
    );

    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByTestId("auth-password-input"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByTestId("auth-confirm-input"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(onSubmit).toHaveBeenCalledWith(
      "alice@example.com",
      "secret123",
      "secret123",
    );
  });

  it("renders google oauth button disabled when oauth is unavailable", () => {
    render(
      <RegisterPage
        onSubmit={vi.fn()}
        onNavigate={vi.fn()}
        passwordRules={[]}
        googleAuthDisabledReason="Google OAuth не настроен."
      />,
    );

    expect(screen.getByTestId("auth-google-button")).toBeDisabled();
    expect(screen.getByText("Google OAuth не настроен.")).toBeInTheDocument();
  });
});
