import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  NotificationProvider,
  useNotifications,
} from "./index";

function NotificationHarness() {
  const notifications = useNotifications();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          notifications.notify({
            variant: "info",
            title: "System",
            message: "Info message",
          })
        }
      >
        Notify
      </button>
      <button
        type="button"
        onClick={() => notifications.success("Saved")}
      >
        Success
      </button>
      <button type="button" onClick={() => notifications.error("Failed")}>
        Error
      </button>
      <button type="button" onClick={() => notifications.warning("Careful")}>
        Warning
      </button>
      <button type="button" onClick={() => notifications.info("Heads up")}>
        Info
      </button>
      <button
        type="button"
        onClick={() =>
          notifications.info({ message: "Persistent", durationMs: 0 })
        }
      >
        Persistent
      </button>
      <button
        type="button"
        onClick={() => {
          Array.from({ length: 5 }, (_, index) =>
            notifications.info({
              title: `Queued ${index + 1}`,
              message: `Message ${index + 1}`,
              durationMs: 0,
            }),
          );
        }}
      >
        Queue
      </button>
      <button type="button" onClick={notifications.clear}>
        Clear
      </button>
    </div>
  );
}

const renderHarness = () =>
  render(
    <NotificationProvider>
      <NotificationHarness />
    </NotificationProvider>,
  );

describe("NotificationProvider", () => {
  it("renders a notification from notify", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Info message")).toBeInTheDocument();
  });

  it("creates variant cards through shortcuts", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Success" }));
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    fireEvent.click(screen.getByRole("button", { name: "Warning" }));
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    expect(screen.getByText("Saved").closest("[data-variant]")).toHaveAttribute(
      "data-variant",
      "success",
    );
    expect(screen.getByText("Saved").closest("article")).toHaveAttribute(
      "role",
      "status",
    );
    expect(screen.getByText("Failed").closest("[data-variant]")).toHaveAttribute(
      "data-variant",
      "error",
    );
    expect(screen.getByText("Failed").closest("article")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByText("Careful").closest("[data-variant]")).toHaveAttribute(
      "data-variant",
      "warning",
    );
    expect(screen.getByText("Heads up").closest("[data-variant]")).toHaveAttribute(
      "data-variant",
      "info",
    );
  });

  it("closes a notification from the close button after exit animation", () => {
    vi.useFakeTimers();
    try {
      renderHarness();

      fireEvent.click(screen.getByRole("button", { name: "Notify" }));
      const notification = screen.getByText("Info message").closest("article");
      expect(notification).not.toBeNull();

      fireEvent.click(
        within(notification as HTMLElement).getByRole("button", {
          name: "Закрыть уведомление",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(240);
      });

      expect(screen.queryByText("Info message")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("auto-dismisses a notification after duration", () => {
    vi.useFakeTimers();
    try {
      renderHarness();

      fireEvent.click(screen.getByRole("button", { name: "Success" }));

      act(() => {
        vi.advanceTimersByTime(5000 + 240);
      });

      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps durationMs <= 0 notifications visible", () => {
    vi.useFakeTimers();
    try {
      renderHarness();

      fireEvent.click(screen.getByRole("button", { name: "Persistent" }));

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(
        within(screen.getByTestId("notification-viewport")).getByText(
          "Persistent",
        ),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stacks up to four visible notifications and promotes queued items", () => {
    vi.useFakeTimers();
    try {
      renderHarness();

      fireEvent.click(screen.getByRole("button", { name: "Queue" }));

      expect(screen.getAllByRole("status")).toHaveLength(4);
      expect(screen.getByText("Queued 1")).toBeInTheDocument();
      expect(screen.queryByText("Queued 5")).not.toBeInTheDocument();

      const firstNotification = screen.getByText("Queued 1").closest("article");
      fireEvent.click(
        within(firstNotification as HTMLElement).getByRole("button", {
          name: "Закрыть уведомление",
        }),
      );
      act(() => {
        vi.advanceTimersByTime(240);
      });

      expect(screen.getByText("Queued 5")).toBeInTheDocument();
      expect(screen.getAllByRole("status")).toHaveLength(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears visible notifications and queue", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByTestId("notification-viewport")).not.toBeInTheDocument();
    expect(screen.queryByText("Queued 1")).not.toBeInTheDocument();
  });
});
