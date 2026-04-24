import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the standalone promo content on the root page", () => {
    render(<HomePage onNavigate={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Чат для своих, где все рядом",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Devil собирает личные сообщения, группы, файлы/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Мессенджер без лишней суеты" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Что дает Devil" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Начать можно за минуту" }),
    ).toBeInTheDocument();
  });

  it("routes visitors to auth flows", () => {
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Войти в Devil" }));
    expect(onNavigate).toHaveBeenCalledWith("/login");

    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));
    expect(onNavigate).toHaveBeenCalledWith("/register");
  });

  it("does not render workspace navigation on the promo page", () => {
    render(<HomePage onNavigate={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Открыть чат" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Мой профиль" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Друзья" })).not.toBeInTheDocument();
  });

  it("keeps the chat preview decorative", () => {
    const { container } = render(<HomePage onNavigate={vi.fn()} />);
    const preview = container.querySelector('[aria-hidden="true"]');

    expect(preview).toHaveTextContent("Публичный чат");
    expect(preview).toHaveTextContent("Сообщение...");
  });
});
