import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the standalone promo content on the root page", () => {
    render(<HomePage onNavigate={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Devil",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Публичный чат, личные и группы"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Откройте общий чат без аккаунта/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Чат, который можно сразу показать людям",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Что умеет Devil" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Контакты и информация" }),
    ).toBeInTheDocument();
  });

  it("routes visitor login buttons to the auth flow", () => {
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect(onNavigate).toHaveBeenCalledWith("/login");

    fireEvent.click(screen.getByRole("button", { name: "Войти в Devil" }));
    expect(onNavigate).toHaveBeenCalledWith("/login");

    expect(
      screen.queryByRole("button", { name: "Создать аккаунт" }),
    ).not.toBeInTheDocument();
  });

  it("delegates login buttons to the auth-aware entry handler", () => {
    const onNavigate = vi.fn();
    const onLoginNavigate = vi.fn();
    render(
      <HomePage onNavigate={onNavigate} onLoginNavigate={onLoginNavigate} />,
    );

    const loginButtons = [
      screen.getByRole("button", { name: "Войти" }),
      screen.getByRole("button", { name: "Войти в Devil" }),
    ];
    for (const button of loginButtons) {
      fireEvent.click(button);
    }

    expect(onLoginNavigate).toHaveBeenCalledTimes(2);
    expect(onNavigate).not.toHaveBeenCalledWith("/login");
  });

  it("does not render workspace navigation on the promo page", () => {
    render(<HomePage onNavigate={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Открыть чат" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Мой профиль" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Друзья" }),
    ).not.toBeInTheDocument();
  });

  it("renders public footer contacts", () => {
    render(<HomePage onNavigate={vi.fn()} />);
    const footer = screen.getByRole("contentinfo", {
      name: "Контакты и информация",
    });

    expect(
      screen.getByRole("heading", { name: "Продукт" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Контакты" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Проект" }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: "Публичный чат" }),
    ).toHaveAttribute("href", "/public");
    expect(
      within(footer).getByRole("link", { name: "GitHub" }),
    ).toHaveAttribute("href", "https://github.com/asdAet");
    expect(
      within(footer).getByRole("link", { name: "GitHub репозиторий" }),
    ).toHaveAttribute("href", "https://github.com/asdAet/Devil");
    expect(
      within(footer).getByRole("link", { name: "Telegram" }),
    ).toHaveAttribute("href", "https://t.me/methoddpp");
  });

  it("keeps the chat preview decorative", () => {
    const { container } = render(<HomePage onNavigate={vi.fn()} />);
    const preview = container.querySelector('[aria-hidden="true"]');

    expect(preview).toHaveTextContent("Публичный чат");
    expect(preview).toHaveTextContent("Сообщение...");
  });
});
