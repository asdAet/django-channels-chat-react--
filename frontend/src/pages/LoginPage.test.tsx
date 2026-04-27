import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("submits credentials", () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByTestId("auth-identifier-input"), {
      target: { value: "demo_login" },
    });
    fireEvent.change(screen.getByTestId("auth-password-input"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(onSubmit).toHaveBeenCalledWith("demo_login", "secret");
  });

  it("does not render google oauth button when oauth is not provided", () => {
    render(<LoginPage onSubmit={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.queryByTestId("auth-google-button")).not.toBeInTheDocument();
  });

  it("renders disabled google oauth button with explicit reason", () => {
    render(
      <LoginPage
        onSubmit={vi.fn()}
        onNavigate={vi.fn()}
        googleAuthDisabledReason="Google OAuth сейчас недоступен."
      />,
    );

    expect(screen.getByTestId("auth-google-button")).toBeDisabled();
    expect(
      screen.getByText("Google OAuth сейчас недоступен."),
    ).toBeInTheDocument();
  });
});
