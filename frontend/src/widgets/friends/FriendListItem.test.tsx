import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Friend } from "../../entities/friend/types";
import { FriendListItem } from "./FriendListItem";

const friend: Friend = {
  id: 1,
  userId: 7,
  publicRef: "alice",
  username: "alice",
  displayName: "Alice",
  profileImage: null,
  avatarCrop: null,
  lastSeen: null,
};

describe("FriendListItem", () => {
  it("opens friend actions in a dropdown menu", () => {
    render(
      <FriendListItem
        friend={friend}
        isOnline
        onMessage={vi.fn()}
        onRemove={vi.fn()}
        onBlock={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Написать" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Действия для Alice" }));

    expect(screen.getByRole("button", { name: "Написать" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Удалить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Заблокировать" })).toBeInTheDocument();
  });

  it("runs the selected friend action", () => {
    const onMessage = vi.fn();
    const onRemove = vi.fn();
    const onBlock = vi.fn();

    render(
      <FriendListItem
        friend={friend}
        isOnline={false}
        onMessage={onMessage}
        onRemove={onRemove}
        onBlock={onBlock}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Действия для Alice" }));
    fireEvent.click(screen.getByRole("button", { name: "Написать" }));
    expect(onMessage).toHaveBeenCalledWith("alice");

    fireEvent.click(screen.getByRole("button", { name: "Действия для Alice" }));
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(onRemove).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByRole("button", { name: "Действия для Alice" }));
    fireEvent.click(screen.getByRole("button", { name: "Заблокировать" }));
    expect(onBlock).toHaveBeenCalledWith("alice");
  });
});
