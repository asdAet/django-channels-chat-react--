import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Message } from "../../entities/message/types";
import {
  DEFAULT_RUNTIME_CONFIG,
  setRuntimeConfig,
} from "../../shared/config/runtimeConfig";
import { MessageBubble } from "./MessageBubble";

const baseMessage: Message = {
  id: 1,
  publicRef: "alice",
  username: "alice",
  content: "audio message",
  profilePic: null,
  avatarCrop: null,
  createdAt: "2026-03-11T10:00:00.000Z",
  editedAt: null,
  isDeleted: false,
  replyTo: null,
  attachments: [],
  reactions: [],
};

const createImageAttachment = (id: number, filename: string) => ({
  id,
  originalFilename: filename,
  contentType: "image/png",
  fileSize: 1024,
  url: `/media/${filename}`,
  thumbnailUrl: `/media/thumb-${filename}`,
  width: 1280,
  height: 720,
});

/**
 * Настраивает эмуляцию touch-устройства через matchMedia.
 */
const installTouchMatchMedia = () => {
  const original = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("(hover: none)") || query.includes("coarse"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  return () => {
    if (original) {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: original,
      });
      return;
    }
    Reflect.deleteProperty(window, "matchMedia");
  };
};

/**
 * Настраивает модель ввода для десктопного сценария.
 */
const installDesktopInputModel = () => {
  const originalMatchMedia = window.matchMedia;
  const hadTouchStart = Object.prototype.hasOwnProperty.call(
    window,
    "ontouchstart",
  );
  const originalTouchStart = (window as Window & { ontouchstart?: unknown })
    .ontouchstart;
  const originalInnerWidth = window.innerWidth;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Reflect.deleteProperty(window, "ontouchstart");

  return () => {
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
    if (hadTouchStart) {
      Object.defineProperty(window, "ontouchstart", {
        configurable: true,
        value: originalTouchStart,
      });
      return;
    }
    Reflect.deleteProperty(window, "ontouchstart");
  };
};

describe("MessageBubble", () => {
  beforeEach(() => {
    setRuntimeConfig({ ...DEFAULT_RUNTIME_CONFIG });
  });

  it("renders AudioAttachmentPlayer for audio attachments", () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        {
          id: 10,
          originalFilename: "voice.mp3",
          contentType: "audio/mpeg",
          fileSize: 1024,
          url: "/media/voice.mp3",
          thumbnailUrl: null,
          width: null,
          height: null,
        },
      ],
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    expect(screen.getByTestId("audio-attachment-player")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Воспроизвести" }),
    ).toBeInTheDocument();
    expect(screen.getByText("voice.mp3")).toBeInTheDocument();
  });

  it("renders concise file type label for non-media attachment", () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        {
          id: 11,
          originalFilename: "archive.custom",
          contentType: "application/octet-stream",
          fileSize: 2048,
          url: null,
          thumbnailUrl: null,
          width: null,
          height: null,
        },
      ],
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    expect(screen.getByText("archive.custom")).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        const className = String(element?.className ?? "");
        return className.includes("attachFileSize") && /\bcustom\b/i.test(content);
      }),
    ).toBeInTheDocument();
  });

  it("renders svg attachment as image even when content type is generic", () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        {
          id: 12,
          originalFilename: "pizza.svg",
          contentType: "text/plain",
          fileSize: 1024,
          url: "/media/pizza.svg",
          thumbnailUrl: null,
          width: null,
          height: null,
        },
      ],
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    const image = screen.getByAltText("pizza.svg");
    expect(image.tagName).toBe("IMG");
    expect(image).toHaveAttribute("src", "/media/pizza.svg");
  });

  it("groups image attachments into media grid preserving upload order", () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        createImageAttachment(1, "01.png"),
        createImageAttachment(2, "02.png"),
        createImageAttachment(3, "03.png"),
        createImageAttachment(4, "04.png"),
        createImageAttachment(5, "05.png"),
        createImageAttachment(6, "06.png"),
        createImageAttachment(7, "07.png"),
      ],
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    const grid = screen.getByTestId("message-media-grid");
    expect(grid).toHaveAttribute(
      "data-count",
      String(DEFAULT_RUNTIME_CONFIG.chatAttachmentMaxPerMessage),
    );
    expect(within(grid).getByText("+2")).toBeInTheDocument();

    const renderedAltOrder = within(grid)
      .getAllByRole("img")
      .map((image) => image.getAttribute("alt"));
    expect(renderedAltOrder).toEqual([
      "01.png",
      "02.png",
      "03.png",
      "04.png",
      "05.png",
    ]);
  });

  it("renders image grid and other attachments in separate sections", () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        createImageAttachment(30, "pic-a.png"),
        createImageAttachment(31, "pic-b.png"),
        {
          id: 32,
          originalFilename: "voice.mp3",
          contentType: "audio/mpeg",
          fileSize: 1024,
          url: "/media/voice.mp3",
          thumbnailUrl: null,
          width: null,
          height: null,
        },
        {
          id: 33,
          originalFilename: "report.pdf",
          contentType: "application/pdf",
          fileSize: 4096,
          url: "/media/report.pdf",
          thumbnailUrl: null,
          width: null,
          height: null,
        },
      ],
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    expect(screen.getByTestId("message-media-grid")).toBeInTheDocument();
    expect(screen.getByTestId("audio-attachment-player")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /report\.pdf/i }),
    ).toBeInTheDocument();
  });

  it("opens full own-message action menu on tap for touch devices", () => {
    const restoreMatchMedia = installTouchMatchMedia();
    try {
      const onReply = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onReact = vi.fn();

      const { container } = render(
        <MessageBubble
          message={baseMessage}
          isOwn={true}
          onlineUsernames={new Set<string>()}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onReact={onReact}
        />,
      );

      const article = container.querySelector(
        'article[data-message-id="1"]',
      ) as HTMLElement;
      fireEvent.click(article);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    } finally {
      restoreMatchMedia();
    }
  });

  it("opens context menu on right click for desktop", () => {
    const restoreDesktopInputModel = installDesktopInputModel();
    try {
      const { container } = render(
        <MessageBubble
          message={baseMessage}
          isOwn={true}
          onlineUsernames={new Set<string>()}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReact={vi.fn()}
        />,
      );

      const article = container.querySelector(
        'article[data-message-id="1"]',
      ) as HTMLElement;

      fireEvent.contextMenu(article);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    } finally {
      restoreDesktopInputModel();
    }
  });

  it("shows edit and delete actions for non-own message when canModerate=true", () => {
    const restoreDesktopInputModel = installDesktopInputModel();
    try {
      const { container } = render(
        <MessageBubble
          message={baseMessage}
          isOwn={false}
          canModerate={true}
          onlineUsernames={new Set<string>()}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReact={vi.fn()}
          onAvatarClick={vi.fn()}
        />,
      );

      const article = container.querySelector(
        'article[data-message-id="1"]',
      ) as HTMLElement;

      fireEvent.contextMenu(article);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("Редактировать")).toBeInTheDocument();
      expect(screen.getByText("Удалить")).toBeInTheDocument();
    } finally {
      restoreDesktopInputModel();
    }
  });

  it("opens context menu from right mouse down fallback on desktop", () => {
    const restoreDesktopInputModel = installDesktopInputModel();
    try {
      const { container } = render(
        <MessageBubble
          message={baseMessage}
          isOwn={true}
          onlineUsernames={new Set<string>()}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReact={vi.fn()}
        />,
      );

      const article = container.querySelector(
        'article[data-message-id="1"]',
      ) as HTMLElement;

      fireEvent.mouseDown(article, { button: 2, clientX: 120, clientY: 160 });
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    } finally {
      restoreDesktopInputModel();
    }
  });

  it("does not open context menu on normal left click for desktop", () => {
    const restoreDesktopInputModel = installDesktopInputModel();
    try {
      const { container } = render(
        <MessageBubble
          message={baseMessage}
          isOwn={true}
          onlineUsernames={new Set<string>()}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReact={vi.fn()}
        />,
      );

      const article = container.querySelector(
        'article[data-message-id="1"]',
      ) as HTMLElement;

      fireEvent.click(article);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    } finally {
      restoreDesktopInputModel();
    }
  });

  it("does not render inline action buttons", () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        onlineUsernames={new Set<string>()}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReact={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Like" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Редактировать" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Удалить" }),
    ).not.toBeInTheDocument();
  });

  it("does not open action menu when tapping an image attachment on touch devices", () => {
    const restoreMatchMedia = installTouchMatchMedia();
    try {
      const message: Message = {
        ...baseMessage,
        attachments: [
          {
            id: 22,
            originalFilename: "photo.jpg",
            contentType: "image/jpeg",
            fileSize: 2048,
            url: "/media/photo.jpg",
            thumbnailUrl: "/media/photo-thumb.jpg",
            width: 1280,
            height: 720,
          },
        ],
      };

      render(
        <MessageBubble
          message={message}
          isOwn={true}
          onlineUsernames={new Set<string>()}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReact={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByAltText("photo.jpg"));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    } finally {
      restoreMatchMedia();
    }
  });

  it("renders read marker state for own messages", () => {
    const { rerender } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        isRead={false}
        onlineUsernames={new Set<string>()}
      />,
    );

    expect(screen.getByTestId("message-read-marker")).toHaveAttribute(
      "data-read",
      "false",
    );

    rerender(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        isRead={true}
        onlineUsernames={new Set<string>()}
      />,
    );

    expect(screen.getByTestId("message-read-marker")).toHaveAttribute(
      "data-read",
      "true",
    );
  });
});
