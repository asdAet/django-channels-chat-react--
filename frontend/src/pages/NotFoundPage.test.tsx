import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders styled 404 state and navigation actions", () => {
    const onNavigate = vi.fn();

    render(<NotFoundPage onNavigate={onNavigate} />);

    expect(
      screen.getByRole("heading", { name: "Страница не найдена" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "В публичный чат" }));
    expect(onNavigate).toHaveBeenCalledWith("/public");

    fireEvent.click(screen.getByRole("button", { name: "На главную" }));
    expect(onNavigate).toHaveBeenCalledWith("/");
  });
});
