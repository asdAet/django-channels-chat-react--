import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Message } from "../entities/message/types";
import type { RoomDetails } from "../entities/room/types";

const wsState = vi.hoisted(() => ({
  status: "online" as "online" | "connecting" | "offline" | "error" | "closed",
  lastError: null as string | null,
  send: vi.fn<(payload: string) => boolean>(),
  options: null as {
    url?: string | null;
    onMessage?: (event: MessageEvent) => void;
  } | null,
}));

const chatRoomMock = vi.hoisted(() => ({
  details: {
    roomId: 1,
    name: "Public",
    kind: "public",
    created: false,
    createdBy: null,
  } as RoomDetails,
  messages: [] as Message[],
  loading: false,
  loadingMore: false,
  hasMore: false,
  error: null as string | null,
  loadMore: vi.fn(),
  reload: vi.fn(),
  setMessages: vi.fn(),
}));

const presenceMock = vi.hoisted(() => ({
  online: [] as Array<{
    publicRef: string;
    username: string;
    profileImage: string | null;
  }>,
  guests: 0,
  status: "online" as const,
  lastError: null as string | null,
}));

const infoPanelMock = vi.hoisted(() => ({
  open: vi.fn(),
}));

const mobileShellMock = vi.hoisted(() => ({
  openDrawer: vi.fn(),
  closeDrawer: vi.fn(),
  toggleDrawer: vi.fn(),
  isDrawerOpen: false,
  isMobileViewport: false,
}));

const locationMock = vi.hoisted(() => ({
  search: "",
  pathname: "/public",
}));

const permissionsMock = vi.hoisted(() => ({
  loading: false,
  raw: null,
  isMember: true,
  isBanned: false,
  canJoin: false,
  canRead: true,
  canWrite: true,
  canAttachFiles: true,
  canReact: true,
  canManageMessages: false,
  canManageRoles: false,
  canManageRoom: false,
  canKick: false,
  canBan: false,
  canInvite: false,
  canMute: false,
  isAdmin: false,
  refresh: vi.fn().mockResolvedValue(undefined),
}));

const groupControllerMock = vi.hoisted(() => ({
  joinGroup: vi.fn().mockResolvedValue(undefined),
}));

const chatControllerMock = vi.hoisted(() => ({
  editMessage: vi.fn().mockResolvedValue({}),
  deleteMessage: vi.fn().mockResolvedValue(undefined),
  addReaction: vi.fn().mockResolvedValue({}),
  removeReaction: vi.fn().mockResolvedValue(undefined),
  searchMessages: vi.fn().mockResolvedValue({ results: [] }),
  uploadAttachments: vi.fn().mockResolvedValue({}),
  markRead: vi.fn().mockResolvedValue({}),
  getMessageReaders: vi.fn().mockResolvedValue({
    roomKind: "direct",
    messageId: 1,
    readAt: null,
    readers: [],
  }),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => locationMock,
}));

vi.mock("../hooks/useChatRoom", () => ({
  useChatRoom: () => chatRoomMock,
}));

vi.mock("../hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => true,
}));

vi.mock("../hooks/useReconnectingWebSocket", () => ({
  useReconnectingWebSocket: (options: unknown) => {
    wsState.options = options as {
      url?: string | null;
      onMessage?: (event: MessageEvent) => void;
    };
    return {
      status: wsState.status,
      lastError: wsState.lastError,
      send: wsState.send,
      reconnect: vi.fn(),
    };
  },
}));

vi.mock("../shared/presence", () => ({
  usePresence: () => presenceMock,
}));

vi.mock("../hooks/useTypingIndicator", () => ({
  useTypingIndicator: () => ({ sendTyping: vi.fn() }),
}));

vi.mock("../hooks/useRoomPermissions", () => ({
  useRoomPermissions: () => permissionsMock,
}));

vi.mock("../shared/directInbox", () => ({
  useDirectInbox: () => ({ setActiveRoom: vi.fn(), markRead: vi.fn() }),
}));

vi.mock("../shared/config/limits", () => ({
  useChatMessageMaxLength: () => 2000,
  useChatAttachmentMaxSizeMb: () => 10,
  useChatAttachmentMaxPerMessage: () => 5,
  useChatAttachmentAllowedTypes: () => [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "video/mp4",
    "audio/mpeg",
    "audio/webm",
  ],
}));

vi.mock("../shared/layout/useInfoPanel", () => ({
  useInfoPanel: () => infoPanelMock,
}));

vi.mock("../shared/layout/useMobileShell", () => ({
  useMobileShell: () => mobileShellMock,
}));

vi.mock("../controllers/ChatController", () => ({
  chatController: chatControllerMock,
}));

vi.mock("../controllers/GroupController", () => ({
  groupController: groupControllerMock,
}));

import { WsAuthProvider } from "../shared/wsAuth";
import { ChatRoomPage } from "./ChatRoomPage";

const user = {
  publicRef: "demo",
  username: "demo",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

const formatReadReceiptTimestamp = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));

/**
 * Создает сообщение от другого пользователя для проверки прав.
 * @param id Идентификатор сущности.
 * @param content Текстовое содержимое.
 * @returns Возвращает значение типа Message.
 */
const makeForeignMessage = (id: number, content: string): Message => ({
  id,
  publicRef: "alice",
  username: "alice",
  content,
  profilePic: null,
  createdAt: `2026-02-13T12:0${Math.max(0, id - 1)}:00.000Z`,
  editedAt: null,
  isDeleted: false,
  replyTo: null,
  attachments: [],
  reactions: [],
});

describe("ChatRoomPage", () => {
  beforeEach(() => {
    wsState.status = "online";
    wsState.lastError = null;
    wsState.send.mockReset().mockReturnValue(true);
    wsState.options = null;

    chatRoomMock.details = {
      roomId: 1,
      name: "Public",
      kind: "public",
      created: false,
      createdBy: null,
    } as RoomDetails;
    chatRoomMock.messages = [];
    chatRoomMock.loading = false;
    chatRoomMock.loadingMore = false;
    chatRoomMock.hasMore = false;
    chatRoomMock.error = null;
    chatRoomMock.loadMore.mockReset();
    chatRoomMock.reload.mockReset();
    chatRoomMock.setMessages.mockReset();
    chatRoomMock.setMessages.mockImplementation(
      (updater: ((prev: Message[]) => Message[]) | Message[]) => {
        chatRoomMock.messages =
          typeof updater === "function"
            ? updater(chatRoomMock.messages)
            : updater;
      },
    );
    permissionsMock.loading = false;
    permissionsMock.raw = null;
    permissionsMock.isMember = true;
    permissionsMock.isBanned = false;
    permissionsMock.canJoin = false;
    permissionsMock.canRead = true;
    permissionsMock.canWrite = true;
    permissionsMock.canAttachFiles = true;
    permissionsMock.canReact = true;
    permissionsMock.canManageMessages = false;
    permissionsMock.canManageRoles = false;
    permissionsMock.canManageRoom = false;
    permissionsMock.canKick = false;
    permissionsMock.canBan = false;
    permissionsMock.canInvite = false;
    permissionsMock.canMute = false;
    permissionsMock.isAdmin = false;
    permissionsMock.refresh.mockReset().mockResolvedValue(undefined);
    groupControllerMock.joinGroup.mockReset().mockResolvedValue(undefined);
    chatControllerMock.markRead.mockReset().mockResolvedValue({});
    chatControllerMock.getMessageReaders.mockReset().mockResolvedValue({
      roomKind: "direct",
      messageId: 1,
      readAt: null,
      readers: [],
    });
    presenceMock.online = [];
    presenceMock.status = "online";
    presenceMock.lastError = null;
    infoPanelMock.open.mockReset();
    mobileShellMock.openDrawer.mockReset();
    mobileShellMock.closeDrawer.mockReset();
    mobileShellMock.toggleDrawer.mockReset();
    mobileShellMock.isDrawerOpen = false;
    mobileShellMock.isMobileViewport = false;
    locationMock.search = "";
    locationMock.pathname = "/public";
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("shows read-only mode for guest in public room", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={null} onNavigate={vi.fn()} />);

    expect(screen.getByTestId("chat-auth-callout")).toBeInTheDocument();
    expect(screen.queryByLabelText("Сообщение")).toBeNull();
  });

  it("appends ws auth token to chat websocket url for authenticated user", () => {
    render(
      <WsAuthProvider token="auth-token">
        <ChatRoomPage
          roomId="1"
          initialRoomKind="public"
          user={user}
          onNavigate={vi.fn()}
        />
      </WsAuthProvider>,
    );

    expect(wsState.options?.url).toContain("/ws/chat/1/");
    expect(wsState.options?.url).toContain("wst=auth-token");
  });

  it("opens the mobile drawer from room chats", () => {
    locationMock.pathname = "/public";

    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByTestId("chat-mobile-open-button"));
    expect(mobileShellMock.openDrawer).toHaveBeenCalledTimes(1);
  });

  it("sends message for authenticated user", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Сообщение"), {
      target: { value: "Hello from test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    );

    expect(wsState.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(wsState.send.mock.calls[0][0]);
    expect(payload.message).toBe("Hello from test");
    expect(payload.username).toBe("demo");
  });

  it("disables submit while websocket is not online", () => {
    wsState.status = "connecting";

    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Сообщение"), {
      target: { value: "text" },
    });

    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeDisabled();
  });

  it("activates local rate limit cooldown from ws error event", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Сообщение"), {
      target: { value: "text" },
    });
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({ error: "rate_limited", retry_after: 2 }),
        }),
      );
    });

    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeDisabled();
  });

  it("shows online status for direct peer", () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: {
        publicRef: "alice",
        username: "alice",
        profileImage: null,
        lastSeen: "2026-02-13T10:00:00.000Z",
      },
    } as RoomDetails;
    presenceMock.online = [
      { publicRef: "alice", username: "alice", profileImage: null },
    ];

    render(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);
    expect(screen.getByText("В сети")).toBeInTheDocument();
  });

  it("highlights own messages", () => {
    chatRoomMock.messages = [
      {
        id: 3,
        publicRef: "demo",
        username: "demo",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      {
        id: 4,
        publicRef: "alice",
        username: "alice",
        content: "other",
        profilePic: null,
        createdAt: "2026-02-13T12:01:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];

    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    expect(
      container.querySelector('article[data-own-message="true"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('article[data-own-message="false"]'),
    ).not.toBeNull();
  });

  it("groups consecutive messages from the same author", () => {
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      {
        id: 3,
        publicRef: "demo",
        username: "demo",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:02:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];

    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    expect(
      container.querySelectorAll('article[data-message-grouped="true"]').length,
    ).toBe(1);
    expect(
      container.querySelectorAll('article[data-message-avatar="true"]').length,
    ).toBe(2);
  });

  it("highlights own messages for fallback public id identity", () => {
    chatRoomMock.messages = [
      {
        id: 3,
        publicRef: "1234567890",
        username: "1234567890",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      {
        id: 4,
        publicRef: "alice",
        username: "alice",
        content: "other",
        profilePic: null,
        createdAt: "2026-02-13T12:01:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];

    const fallbackUser = {
      ...user,
      username: "",
      publicRef: "1234567890",
      publicId: "1234567890",
    };

    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={fallbackUser} onNavigate={vi.fn()} />,
    );

    expect(
      container.querySelector('article[data-own-message="true"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('article[data-own-message="false"]'),
    ).not.toBeNull();
  });

  it("shows join CTA and hides input for public group non-member", async () => {
    chatRoomMock.details = {
      roomId: 3,
      name: "Public Group",
      kind: "group",
      created: false,
      createdBy: null,
    } as RoomDetails;
    permissionsMock.loading = false;
    permissionsMock.isMember = false;
    permissionsMock.canWrite = false;
    permissionsMock.canJoin = true;

    render(<ChatRoomPage roomId="3" initialRoomKind="group" user={user} onNavigate={vi.fn()} />);

    expect(screen.getByTestId("group-join-callout")).toBeInTheDocument();
    expect(screen.queryByLabelText("Сообщение")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Присоединиться" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(groupControllerMock.joinGroup).toHaveBeenCalledWith("3");
    expect(permissionsMock.refresh).toHaveBeenCalledTimes(1);
    expect(chatRoomMock.reload).toHaveBeenCalledTimes(1);
  });

  it("deduplicates mark-read for same last message id", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: {
        publicRef: "alice",
        username: "alice",
        profileImage: null,
        lastSeen: null,
      },
    } as RoomDetails;
    chatRoomMock.messages = [
      {
        id: 1,
        publicRef: "alice",
        username: "alice",
        content: "first",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      {
        id: 2,
        publicRef: "alice",
        username: "alice",
        content: "second",
        profilePic: null,
        createdAt: "2026-02-13T12:01:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];

    const { container, rerender } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    /**
     * Эмулирует параметры viewport для тестового сценария.
     */
    const mockViewport = () => {
      Object.defineProperty(chatLog, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ bottom: 600 }),
      });
      chatLog
        .querySelectorAll<HTMLElement>("article[data-message-id]")
        .forEach((node, index) => {
          Object.defineProperty(node, "getBoundingClientRect", {
            configurable: true,
            value: () => ({ bottom: 120 + index * 120 }),
          });
        });
    };
    mockViewport();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    });
    fireEvent.scroll(chatLog);

    await waitFor(() => {
      expect(chatControllerMock.markRead).toHaveBeenCalledWith("2", 2);
    });
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(1);

    chatRoomMock.messages = [...chatRoomMock.messages];
    rerender(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);
    mockViewport();
    fireEvent.scroll(chatLog);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    });
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(1);

    chatRoomMock.messages = [
      ...chatRoomMock.messages,
      {
        id: 3,
        publicRef: "alice",
        username: "alice",
        content: "third",
        profilePic: null,
        createdAt: "2026-02-13T12:02:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];
    rerender(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);
    mockViewport();
    fireEvent.scroll(chatLog);

    await waitFor(() => {
      expect(chatControllerMock.markRead).toHaveBeenCalledWith("2", 3);
    });
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(2);
  });

  it("accepts arbitrary attachment type on client", () => {
    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const invalidFile = new File(["payload"], "virus.exe", {
      type: "application/x-msdownload",
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      screen.queryByText(/имеет неподдерживаемый тип/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();
    expect(chatControllerMock.uploadAttachments).not.toHaveBeenCalled();
  });

  it("allows oversized attachment selection for superuser", () => {
    const { container } = render(
      <ChatRoomPage
        roomId="1" initialRoomKind="public"
        user={{ ...user, isSuperuser: true }}
        onNavigate={vi.fn()}
      />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const oversizedFile = new File(
      [new Uint8Array(11 * 1024 * 1024)],
      "oversized.bin",
      { type: "application/octet-stream" },
    );
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByText("Вложения: 1")).toBeInTheDocument();
    expect(screen.getByText("oversized.bin")).toBeInTheDocument();
    expect(screen.queryByText(/больше 10 МБ/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();
  });

  it("allows attachment count above runtime limit for superuser", () => {
    const { container } = render(
      <ChatRoomPage
        roomId="1" initialRoomKind="public"
        user={{ ...user, isSuperuser: true }}
        onNavigate={vi.fn()}
      />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const files = Array.from({ length: 6 }, (_, index) =>
      new File(["x"], `file-${index + 1}.txt`, { type: "text/plain" }),
    );
    fireEvent.change(fileInput, { target: { files } });

    expect(screen.getByText("Вложения: 6")).toBeInTheDocument();
    expect(
      screen.queryByText(/Можно прикрепить не более 5 файлов/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();
  });

  it("keeps attachment count limit for non-superuser", () => {
    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const files = Array.from({ length: 6 }, (_, index) =>
      new File(["x"], `user-file-${index + 1}.txt`, { type: "text/plain" }),
    );
    fireEvent.change(fileInput, { target: { files } });

    expect(screen.getByText("Вложения: 5")).toBeInTheDocument();
    expect(screen.getByText(/Превышен лимит вложений \(5\)\./i)).toBeInTheDocument();
  });

  it("keeps attachment size limit for non-superuser", () => {
    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const oversizedFile = new File(
      [new Uint8Array(11 * 1024 * 1024)],
      "user-oversized.bin",
      { type: "application/octet-stream" },
    );
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.queryByText("Вложения: 1")).not.toBeInTheDocument();
    expect(
      screen.getByText('Файл "user-oversized.bin" больше 10 МБ.'),
    ).toBeInTheDocument();
  });

  it("queues pasted files from clipboard items", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    const input = screen.getByLabelText("Сообщение");
    const pastedFile = new File(["clip"], "clipboard.bin", {
      type: "application/octet-stream",
    });

    fireEvent.paste(input, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "application/octet-stream",
            getAsFile: () => pastedFile,
          },
        ],
        files: [pastedFile],
      },
    });

    expect(screen.getByText("Вложения: 1")).toBeInTheDocument();
    expect(screen.getByText("clipboard.bin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();
  });

  it("queues pasted files from clipboard fallback files list", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    const input = screen.getByLabelText("Сообщение");
    const pastedFile = new File(["mobile"], "mobile-clipboard.txt", {
      type: "text/plain",
    });

    fireEvent.paste(input, {
      clipboardData: {
        items: [
          {
            kind: "string",
            type: "text/plain",
            getAsFile: () => null,
          },
        ],
        files: [pastedFile],
      },
    });

    expect(screen.getByText("Вложения: 1")).toBeInTheDocument();
    expect(screen.getByText("mobile-clipboard.txt")).toBeInTheDocument();
  });

  it("shows drop overlay and queues dropped files", () => {
    render(<ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />);

    const chatRoot = screen.getByTestId("chat-page-root");
    const droppedFile = new File(["drop"], "drag-drop.txt", {
      type: "text/plain",
    });

    fireEvent.dragEnter(chatRoot, {
      dataTransfer: {
        types: ["Files"],
        files: [droppedFile],
      },
    });
    expect(screen.getByTestId("chat-drop-overlay")).toBeInTheDocument();

    fireEvent.drop(chatRoot, {
      dataTransfer: {
        types: ["Files"],
        files: [droppedFile],
      },
    });

    expect(screen.queryByTestId("chat-drop-overlay")).toBeNull();
    expect(screen.getByText("Вложения: 1")).toBeInTheDocument();
    expect(screen.getByText("drag-drop.txt")).toBeInTheDocument();
  });

  it("uploads mixed attachment types and maps backend error by code", async () => {
    chatControllerMock.uploadAttachments.mockRejectedValueOnce({
      data: {
        code: "unsupported_type",
        details: { allowedTypes: ["text/plain"] },
      },
      message: "Request failed",
    });

    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const invalidFile = new File(["payload"], "bad.exe", {
      type: "application/x-msdownload",
    });
    const validFile = new File(["hello"], "ok.txt", { type: "text/plain" });
    fireEvent.change(fileInput, {
      target: { files: [invalidFile, validFile] },
    });

    expect(
      screen.queryByText(/имеет неподдерживаемый тип/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(chatControllerMock.uploadAttachments).toHaveBeenCalledTimes(1);
    const filesArg = chatControllerMock.uploadAttachments.mock
      .calls[0][1] as File[];
    expect(filesArg).toHaveLength(2);
    expect(filesArg.map((f) => f.name)).toEqual(["bad.exe", "ok.txt"]);

    expect(
      screen.getByText("Тип файла не поддерживается. Разрешены: text/plain."),
    ).toBeInTheDocument();
  });

  it("keeps unread divider anchored while partially reading and after full read in current chat", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      makeForeignMessage(3, "third"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    /**
     * Устанавливает scroll metrics.
     * @param scrollTop Текущая позиция прокрутки сверху.
     * @param scrollHeight Полная высота области прокрутки.
     * @param clientHeight Высота видимой области.
     */
    const setScrollMetrics = (
      scrollTop: number,
      scrollHeight = 1200,
      clientHeight = 400,
    ) => {
      Object.defineProperty(chatLog, "scrollTop", {
        configurable: true,
        value: scrollTop,
        writable: true,
      });
      Object.defineProperty(chatLog, "scrollHeight", {
        configurable: true,
        value: scrollHeight,
      });
      Object.defineProperty(chatLog, "clientHeight", {
        configurable: true,
        value: clientHeight,
      });
    };

    /**
     * Устанавливает viewport.
     * @param listBottom Координата нижней границы списка.
     * @param bottoms Список координат нижних границ элементов.
     */
    const setViewport = (
      listBottom: number,
      bottoms: Record<number, number>,
    ) => {
      Object.defineProperty(chatLog, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ bottom: listBottom }),
      });
      chatLog
        .querySelectorAll<HTMLElement>("article[data-message-id]")
        .forEach((node) => {
          const id = Number(node.dataset.messageId);
          Object.defineProperty(node, "getBoundingClientRect", {
            configurable: true,
            value: () => ({ bottom: bottoms[id] ?? Number.MAX_SAFE_INTEGER }),
          });
        });
    };

    setScrollMetrics(160);
    setViewport(220, { 1: 180, 2: 360, 3: 520 });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });
    fireEvent.scroll(chatLog);

    let divider = chatLog.querySelector<HTMLElement>("[data-unread-divider]");
    expect(divider).not.toBeNull();
    expect(divider?.dataset.unreadAnchorId).toBe("1");

    const firstMessage = chatLog.querySelector('article[data-message-id="1"]');
    const indexOfDivider = Array.from(chatLog.children).findIndex(
      (node) => node === divider,
    );
    const indexOfFirstMessage = Array.from(chatLog.children).findIndex(
      (node) => node === firstMessage,
    );
    expect(indexOfDivider).toBeGreaterThanOrEqual(0);
    expect(indexOfDivider).toBeLessThan(indexOfFirstMessage);

    setScrollMetrics(200);
    setViewport(220, { 1: 120, 2: 180, 3: 410 });
    fireEvent.scroll(chatLog);
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    });

    divider = chatLog.querySelector<HTMLElement>("[data-unread-divider]");
    expect(divider).not.toBeNull();
    expect(divider?.dataset.unreadAnchorId).toBe("1");

    setScrollMetrics(780, 1200, 400);
    setViewport(220, { 1: 110, 2: 150, 3: 190 });
    fireEvent.scroll(chatLog);
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    divider = chatLog.querySelector<HTMLElement>("[data-unread-divider]");
    expect(divider).not.toBeNull();
    expect(divider?.dataset.unreadAnchorId).toBe("1");
  });

  it("hides unread divider when current user sends a message", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      value: 160,
      writable: true,
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(chatLog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 220 }),
    });
    chatLog
      .querySelectorAll<HTMLElement>("article[data-message-id]")
      .forEach((node, index) => {
        Object.defineProperty(node, "getBoundingClientRect", {
          configurable: true,
          value: () => ({ bottom: 180 + index * 180 }),
        });
      });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });
    fireEvent.scroll(chatLog);

    expect(chatLog.querySelector("[data-unread-divider]")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Сообщение"), {
      target: { value: "my message" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 60));
    });

    expect(chatLog.querySelector("[data-unread-divider]")).toBeNull();
  });

  it("does not show unread divider for incoming message when user is at bottom", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 2,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];

    const { container, rerender } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    /**
     * Устанавливает scroll metrics.
     * @param scrollTop Текущая позиция прокрутки сверху.
     * @param scrollHeight Полная высота области прокрутки.
     * @param clientHeight Высота видимой области.
     */
    const setScrollMetrics = (
      scrollTop: number,
      scrollHeight = 1200,
      clientHeight = 400,
    ) => {
      Object.defineProperty(chatLog, "scrollTop", {
        configurable: true,
        value: scrollTop,
        writable: true,
      });
      Object.defineProperty(chatLog, "scrollHeight", {
        configurable: true,
        value: scrollHeight,
      });
      Object.defineProperty(chatLog, "clientHeight", {
        configurable: true,
        value: clientHeight,
      });
    };

    /**
     * Устанавливает viewport.
     * @param listBottom Координата нижней границы списка.
     * @param bottoms Список координат нижних границ элементов.
     */
    const setViewport = (
      listBottom: number,
      bottoms: Record<number, number>,
    ) => {
      Object.defineProperty(chatLog, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ bottom: listBottom }),
      });
      chatLog
        .querySelectorAll<HTMLElement>("article[data-message-id]")
        .forEach((node) => {
          const id = Number(node.dataset.messageId);
          Object.defineProperty(node, "getBoundingClientRect", {
            configurable: true,
            value: () => ({ bottom: bottoms[id] ?? Number.MAX_SAFE_INTEGER }),
          });
        });
    };

    setScrollMetrics(800, 1200, 400);
    setViewport(260, { 1: 120, 2: 170 });
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    });
    fireEvent.scroll(chatLog);

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            id: 3,
            message: "third",
            username: "alice",
            profile_pic: null,
            room: "dm_1",
            createdAt: "2026-02-13T12:03:00.000Z",
            attachments: [],
          }),
        }),
      );
    });

    rerender(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);
    setViewport(260, { 1: 120, 2: 170, 3: 210 });
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 240));
    });
    fireEvent.scroll(chatLog);

    expect(chatLog.querySelector("[data-unread-divider]")).toBeNull();
  });

  it("performs a single initial scroll to bottom when unread messages are absent", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 3,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      makeForeignMessage(3, "third"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 0;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      get: () => 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      get: () => 400,
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    expect(scrollWrites.filter((value) => value === 1200)).toHaveLength(1);
    expect(chatLog.querySelector("[data-unread-divider]")).toBeNull();
  });

  it("does not jump to bottom while positioning to first unread on enter", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      makeForeignMessage(3, "third"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 0;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      get: () => 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      get: () => 400,
    });

    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }

    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(scrollWrites).not.toContain(1200);
  });

  it("does not inherit unread divider from previous room while next chat is loading", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];
    chatRoomMock.loading = false;

    const { container, rerender } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    const dividerInFirstChat = container.querySelector<HTMLElement>(
      "[data-unread-divider]",
    );
    expect(dividerInFirstChat).not.toBeNull();
    expect(dividerInFirstChat?.dataset.unreadAnchorId).toBe("1");

    chatRoomMock.loading = true;
    rerender(<ChatRoomPage roomId="22" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);
    expect(container.querySelector("[data-unread-divider]")).toBeNull();

    chatRoomMock.loading = false;
    chatRoomMock.details = {
      roomId: 22,
      name: "dm2",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@bob", username: "bob", profileImage: null, lastSeen: null },
      lastReadMessageId: 2,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "other-first"),
      makeForeignMessage(2, "other-second"),
    ];
    rerender(<ChatRoomPage roomId="22" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    expect(container.querySelector("[data-unread-divider]")).toBeNull();
  });

  it("does not auto-reposition on non-append message updates", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 160;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(chatLog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 260 }),
    });
    chatLog
      .querySelectorAll<HTMLElement>("article[data-message-id]")
      .forEach((node, index) => {
        Object.defineProperty(node, "getBoundingClientRect", {
          configurable: true,
          value: () => ({ bottom: 140 + index * 80 }),
        });
      });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });
    scrollTopValue = 160;
    fireEvent.scroll(chatLog);
    const writesBeforeEdit = scrollWrites.length;

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "message_edit",
            messageId: 1,
            content: "edited",
            editedAt: "2026-02-13T12:05:00.000Z",
            editedBy: "alice",
          }),
        }),
      );
    });

    expect(scrollWrites.length).toBe(writesBeforeEdit);
    expect(scrollTopValue).toBe(160);
  });

  it("does not auto-scroll for incoming message when user is away from bottom", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 2,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];

    const { container, rerender } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 0;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      get: () => 1320,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(chatLog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 260 }),
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    scrollTopValue = 160;
    fireEvent.scroll(chatLog);
    const writesBeforeIncoming = scrollWrites.length;

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            id: 3,
            message: "third",
            publicRef: "alice",
            username: "alice",
            roomId: 1,
            createdAt: "2026-02-13T12:03:00.000Z",
            attachments: [],
            type: "chat_message",
          }),
        }),
      );
    });

    rerender(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    });

    expect(scrollWrites.length).toBe(writesBeforeIncoming);
    expect(scrollTopValue).toBe(160);
  });

  it("does not auto-reposition on read receipt events", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: { publicRef: "@alice", username: "alice", profileImage: null, lastSeen: null },
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [
      {
        id: 1,
        publicRef: "demo",
        username: "demo",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      makeForeignMessage(2, "second"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 160;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(chatLog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 260 }),
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });
    scrollTopValue = 160;
    fireEvent.scroll(chatLog);
    const writesBeforeReceipt = scrollWrites.length;

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "read_receipt",
            userId: 2,
            publicRef: "alice",
            username: "alice",
            lastReadMessageId: 1,
            lastReadAt: "2026-02-13T12:05:00.000Z",
            roomId: 1,
          }),
        }),
      );
    });

    expect(scrollWrites.length).toBe(writesBeforeReceipt);
    expect(scrollTopValue).toBe(160);
  });

  it("group chat: performs a single initial scroll to bottom when unread messages are absent", async () => {
    chatRoomMock.details = {
      roomId: 4,
      name: "Team",
      kind: "group",
      created: false,
      createdBy: "owner",
      lastReadMessageId: 3,
      isPublic: false,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      makeForeignMessage(3, "third"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="4" initialRoomKind="group" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 0;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      get: () => 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      get: () => 400,
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    expect(scrollWrites.filter((value) => value === 1200)).toHaveLength(1);
    expect(chatLog.querySelector("[data-unread-divider]")).toBeNull();
  });

  it("group chat: does not jump to bottom while positioning to first unread on enter", async () => {
    chatRoomMock.details = {
      roomId: 4,
      name: "Team",
      kind: "group",
      created: false,
      createdBy: "owner",
      lastReadMessageId: 0,
      isPublic: false,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
      makeForeignMessage(3, "third"),
    ];

    const { container } = render(
      <ChatRoomPage roomId="4" initialRoomKind="group" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    const scrollWrites: number[] = [];
    let scrollTopValue = 0;
    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
        scrollWrites.push(value);
      },
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      get: () => 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      get: () => 400,
    });

    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }

    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(scrollWrites).not.toContain(1200);
  });

  it("group chat: ignores non-user scroll events for loadMore on enter", async () => {
    chatRoomMock.details = {
      roomId: 4,
      name: "Team",
      kind: "group",
      created: false,
      createdBy: "owner",
      lastReadMessageId: 0,
      isPublic: false,
    } as RoomDetails;
    chatRoomMock.messages = [
      makeForeignMessage(1, "first"),
      makeForeignMessage(2, "second"),
    ];
    chatRoomMock.hasMore = true;
    chatRoomMock.loading = false;
    chatRoomMock.loadingMore = false;

    const { container } = render(
      <ChatRoomPage roomId="4" initialRoomKind="group" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;

    Object.defineProperty(chatLog, "scrollTop", {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(chatLog, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(chatLog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 260 }),
    });
    chatLog
      .querySelectorAll<HTMLElement>("article[data-message-id]")
      .forEach((node, index) => {
        Object.defineProperty(node, "getBoundingClientRect", {
          configurable: true,
          value: () => ({ bottom: 140 + index * 80 }),
        });
      });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    fireEvent.scroll(chatLog);
    expect(chatRoomMock.loadMore).not.toHaveBeenCalled();
  });

  it("flushes pending read with sendBeacon on pagehide", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "DM",
      kind: "direct",
      created: false,
      createdBy: null,
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [];
    window.sessionStorage.setItem("chat.pendingRead.2", "5");

    const sendBeaconSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconSpy,
    });

    render(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(sendBeaconSpy).toHaveBeenCalled();
    const [url, payload] = sendBeaconSpy.mock.calls.at(-1) as [
      string,
      FormData,
    ];
    expect(url).toBe("/api/chat/2/read/");
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get("lastReadMessageId")).toBe("5");
  });

  it("falls back to fetch keepalive when sendBeacon is unavailable", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "DM",
      kind: "direct",
      created: false,
      createdBy: null,
      lastReadMessageId: 0,
    } as RoomDetails;
    chatRoomMock.messages = [];
    window.sessionStorage.setItem("chat.pendingRead.2", "6");

    const sendBeaconSpy = vi.fn().mockReturnValue(false);
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconSpy,
    });

    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const previousVisibilityState = Object.getOwnPropertyDescriptor(
      document,
      "visibilityState",
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(sendBeaconSpy).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/chat/2/read/",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
      }),
    );

    if (previousVisibilityState) {
      Object.defineProperty(
        document,
        "visibilityState",
        previousVisibilityState,
      );
    }
    vi.unstubAllGlobals();
  });

  it("smoothly scrolls to bottom after sending own message", () => {
    const { container } = render(
      <ChatRoomPage roomId="1" initialRoomKind="public" user={user} onNavigate={vi.fn()} />,
    );
    const chatLog = container.querySelector(
      '[aria-live="polite"]',
    ) as HTMLDivElement;
    expect(chatLog).toBeTruthy();

    const scrollToSpy = vi.fn();
    Object.defineProperty(chatLog, "scrollTo", {
      configurable: true,
      value: scrollToSpy,
    });
    Object.defineProperty(chatLog, "scrollHeight", {
      configurable: true,
      value: 840,
    });

    fireEvent.change(screen.getByLabelText("Сообщение"), {
      target: { value: "scroll test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Отправить сообщение" }),
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 840, behavior: "smooth" });
  });

  it("opens direct readers menu for own message with avatar and profile action", async () => {
    chatRoomMock.details = {
      roomId: 2,
      name: "dm",
      kind: "direct",
      created: false,
      createdBy: null,
      peer: {
        publicRef: "alice",
        username: "alice",
        displayName: "Alice",
        profileImage: "https://cdn.example.com/alice.jpg",
        lastSeen: null,
      },
    } as RoomDetails;
    chatRoomMock.messages = [
      {
        id: 1,
        publicRef: "demo",
        username: "demo",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];
    chatControllerMock.getMessageReaders.mockResolvedValueOnce({
      roomKind: "direct",
      messageId: 1,
      readAt: "2026-02-13T12:10:00.000Z",
      readers: [],
    });

    const { container } = render(
      <ChatRoomPage roomId="2" initialRoomKind="direct" user={user} onNavigate={vi.fn()} />,
    );
    const article = container.querySelector(
      'article[data-message-id="1"]',
    ) as HTMLElement;

    fireEvent.contextMenu(article);
    fireEvent.click(screen.getByText("Кто прочитал"));

    await waitFor(() => {
      expect(chatControllerMock.getMessageReaders).toHaveBeenCalledWith("2", 1);
    });
    const readersMenu = screen.getByRole("menu", { name: "Кто прочитал" });
    expect(await within(readersMenu).findByText("Alice")).toBeInTheDocument();
    expect(
      await within(readersMenu).findByRole("img", { name: "Alice" }),
    ).toBeInTheDocument();
    expect(
      within(readersMenu).getByText(
        formatReadReceiptTimestamp("2026-02-13T12:10:00.000Z"),
      ),
    ).toBeInTheDocument();

    fireEvent.click(within(readersMenu).getByRole("menuitem", { name: /Alice/ }));
    expect(infoPanelMock.open).toHaveBeenCalledWith("profile", "alice");
  });

  it("opens group readers menu with avatars and profile action", async () => {
    chatRoomMock.details = {
      roomId: 4,
      name: "Team",
      kind: "group",
      created: false,
      createdBy: "owner",
      isPublic: false,
    } as RoomDetails;
    chatRoomMock.messages = [
      {
        id: 8,
        publicRef: "demo",
        username: "demo",
        content: "mine",
        profilePic: null,
        createdAt: "2026-02-13T12:00:00.000Z",
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ];
    chatControllerMock.getMessageReaders.mockResolvedValueOnce({
      roomKind: "group",
      messageId: 8,
      readAt: null,
      readers: [
        {
          userId: 2,
          publicRef: "alice",
          username: "alice",
          displayName: "Alice",
          profileImage: "https://cdn.example.com/alice.jpg",
          avatarCrop: null,
          readAt: "2026-02-13T12:10:00.000Z",
        },
        {
          userId: 3,
          publicRef: "bob",
          username: "bob",
          displayName: "Bob",
          profileImage: "https://cdn.example.com/bob.jpg",
          avatarCrop: null,
          readAt: "2026-02-13T12:09:00.000Z",
        },
      ],
    });

    const { container } = render(
      <ChatRoomPage roomId="4" initialRoomKind="group" user={user} onNavigate={vi.fn()} />,
    );
    const article = container.querySelector(
      'article[data-message-id="8"]',
    ) as HTMLElement;

    fireEvent.contextMenu(article);
    fireEvent.click(screen.getByText("Кто прочитал"));

    await waitFor(() => {
      expect(chatControllerMock.getMessageReaders).toHaveBeenCalledWith("4", 8);
    });
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: "Alice" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatReadReceiptTimestamp("2026-02-13T12:10:00.000Z"),
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Bob" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /Alice/ }));
    expect(infoPanelMock.open).toHaveBeenCalledWith("profile", "alice");
  });
});

