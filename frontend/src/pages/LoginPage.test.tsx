import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("submits credentials", () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "demo@example.com" },
    });
    fireEvent.change(screen.getByTestId("auth-password-input"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(onSubmit).toHaveBeenCalledWith(
      "demo@example.com",
      "secret",
      undefined,
    );
  });

  it("renders google oauth button disabled when oauth is not provided", () => {
    render(<LoginPage onSubmit={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByTestId("auth-google-button")).toBeDisabled();
  });
});
