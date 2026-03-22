import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ChatResolveResult,
  GlobalSearchResult,
  ReadStateResult,
  RoomAttachmentsResult,
  SearchResult,
  UnreadCountItem,
  UploadResult,
} from "../domain/interfaces/IApiService";
import type {
  DirectChatsResponseDto,
  RoomMessagesDto,
} from "../dto";
import type { RoomDetails as RoomDetailsDto } from "../entities/room/types";

const apiMocks = vi.hoisted(() => ({
  resolveChatTarget: vi.fn<(target: string) => Promise<ChatResolveResult>>(),
  getRoomDetails: vi.fn<(roomId: string) => Promise<RoomDetailsDto>>(),
  getRoomMessages:
    vi.fn<
      (
        roomId: string,
        params?: { limit?: number; beforeId?: number },
      ) => Promise<RoomMessagesDto>
    >(),
  getDirectChats: vi.fn<() => Promise<DirectChatsResponseDto>>(),
  getUnreadCounts: vi.fn<() => Promise<UnreadCountItem[]>>(),
  editMessage:
    vi.fn<
      (
        roomId: string,
        messageId: number,
        content: string,
      ) => Promise<{ id: number; content: string; editedAt: string }>
    >(),
  deleteMessage: vi.fn<(roomId: string, messageId: number) => Promise<void>>(),
  addReaction: vi.fn<
    (
      roomId: string,
      messageId: number,
      emoji: string,
    ) => Promise<{
      messageId: number;
      emoji: string;
      userId: number;
      username: string;
    }>
  >(),
  removeReaction:
    vi.fn<(roomId: string, messageId: number, emoji: string) => Promise<void>>(),
  searchMessages:
    vi.fn<(roomId: string, query: string) => Promise<SearchResult>>(),
  uploadAttachments: vi.fn<
    (
      roomId: string,
      files: File[],
      options?: {
        onProgress?: (percent: number) => void;
        messageContent?: string;
        replyTo?: number | null;
        signal?: AbortSignal;
      },
    ) => Promise<UploadResult>
  >(),
  markRead:
    vi.fn<(roomId: string, messageId?: number) => Promise<ReadStateResult>>(),
  globalSearch: vi.fn<
    (
      query: string,
      params?: {
        usersLimit?: number;
        groupsLimit?: number;
        messagesLimit?: number;
      },
    ) => Promise<GlobalSearchResult>
  >(),
  getRoomAttachments:
    vi.fn<
      (
        roomId: string,
        params?: { limit?: number; before?: number },
      ) => Promise<RoomAttachmentsResult>
    >(),
}));

vi.mock("../adapters/ApiService", () => ({
  apiService: apiMocks,
}));

/**
 * Загружает экземпляр контроллера для тестового сценария.
 */
const loadController = async () => {
  vi.resetModules();
  const mod = await import("./ChatController");
  return mod.chatController;
};

/**
 * Сбрасывает состояния моков API перед каждым тестом.
 */
const resetApiMocks = () => {
  Object.values(apiMocks).forEach((mock) => {
    mock.mockReset();
  });
};

describe("ChatController", () => {
  beforeEach(() => {
    resetApiMocks();
  });

  it("deduplicates in-flight room details by room id", async () => {
    /**
     * Хранит значение settle.
     */
    let settle: (value: RoomDetailsDto) => void = () => undefined;
    const pending = new Promise<RoomDetailsDto>((res) => {
      settle = res;
    });
    apiMocks.getRoomDetails.mockReturnValue(pending);

    const chatController = await loadController();

    const firstPromise = chatController.getRoomDetails("abc");
    const secondPromise = chatController.getRoomDetails("abc");

    expect(apiMocks.getRoomDetails).toHaveBeenCalledTimes(1);

    settle({
      roomId: 123,
      name: "Room",
      kind: "private",
      created: false,
      createdBy: null,
    });
    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(first.roomId).toBe(123);
    expect(second.roomId).toBe(123);
  });

  it("does not cache room details after request completes", async () => {
    apiMocks.getRoomDetails.mockResolvedValue({
      roomId: 123,
      name: "Room",
      kind: "private",
      created: false,
      createdBy: null,
    });

    const chatController = await loadController();

    await chatController.getRoomDetails("abc");
    await chatController.getRoomDetails("abc");

    expect(apiMocks.getRoomDetails).toHaveBeenCalledTimes(2);
    expect(apiMocks.getRoomDetails).toHaveBeenNthCalledWith(1, "abc");
    expect(apiMocks.getRoomDetails).toHaveBeenNthCalledWith(2, "abc");
  });

  it("deduplicates in-flight room messages by params", async () => {
    /**
     * Хранит значение settle.
     */
    let settle: (value: RoomMessagesDto) => void = () => undefined;
    const pending = new Promise<RoomMessagesDto>((res) => {
      settle = res;
    });
    apiMocks.getRoomMessages.mockReturnValue(pending);

    const chatController = await loadController();

    const firstPromise = chatController.getRoomMessages("public", {
      limit: 50,
    });
    const secondPromise = chatController.getRoomMessages("public", {
      limit: 50,
    });

    expect(apiMocks.getRoomMessages).toHaveBeenCalledTimes(1);

    settle({
      messages: [],
      pagination: { limit: 50, hasMore: false, nextBefore: null },
    });

    await Promise.all([firstPromise, secondPromise]);
  });

  it("does not cache room messages after request completes", async () => {
    apiMocks.getRoomMessages.mockResolvedValue({
      messages: [],
      pagination: { limit: 50, hasMore: false, nextBefore: null },
    });

    const chatController = await loadController();

    await chatController.getRoomMessages("public", { limit: 50 });
    await chatController.getRoomMessages("public", { limit: 50 });

    expect(apiMocks.getRoomMessages).toHaveBeenCalledTimes(2);
  });

  it("deduplicates in-flight direct chats request", async () => {
    /**
     * Хранит значение settle.
     */
    let settle: (value: DirectChatsResponseDto) => void = () => undefined;
    const pending = new Promise<DirectChatsResponseDto>((res) => {
      settle = res;
    });
    apiMocks.getDirectChats.mockReturnValue(pending);

    const chatController = await loadController();

    const firstPromise = chatController.getDirectChats();
    const secondPromise = chatController.getDirectChats();

    expect(apiMocks.getDirectChats).toHaveBeenCalledTimes(1);

    settle({
      items: [
        {
          roomId: 123,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await Promise.all([firstPromise, secondPromise]);
  });

  it("does not cache direct chats after request completes", async () => {
    apiMocks.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 123,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const chatController = await loadController();

    await chatController.getDirectChats();
    await chatController.getDirectChats();

    expect(apiMocks.getDirectChats).toHaveBeenCalledTimes(2);
  });

  it("delegates pass-through methods to apiService with original args", async () => {
    const resolvedChatTarget: ChatResolveResult = {
      targetKind: "direct",
      roomId: 1,
      roomKind: "direct",
      resolvedTarget: "@alice",
      peer: {
        userId: 2,
        publicRef: "@alice",
        username: "alice",
        displayName: "Alice",
        profileImage: null,
        avatarCrop: null,
        lastSeen: null,
        bio: "",
        blocked: false,
      },
    };
    const unreadCounts: UnreadCountItem[] = [{ roomId: 101, unreadCount: 3 }];
    const editedMessage = {
      id: 7,
      content: "edited",
      editedAt: "2026-01-01T00:00:00.000Z",
    };
    const reaction = {
      messageId: 7,
      emoji: "🔥",
      userId: 2,
      publicRef: "alice",
      username: "alice",
    };
    const search: SearchResult = {
      results: [
        {
          id: 1,
          publicRef: "alice",
          username: "alice",
          content: "hello",
          createdAt: "2026-01-01T00:00:00.000Z",
          highlight: "hello",
        },
      ],
      pagination: { limit: 20, hasMore: false, nextBefore: null },
    };
    const upload: UploadResult = {
      id: 10,
      content: "files",
      attachments: [
        {
          id: 1,
          originalFilename: "a.txt",
          contentType: "text/plain",
          fileSize: 4,
          url: null,
          thumbnailUrl: null,
          width: null,
          height: null,
        },
      ],
    };
    const readState: ReadStateResult = {
      roomId: 101,
      lastReadMessageId: 44,
    };
    const searchResult: GlobalSearchResult = {
      users: [
        {
          publicRef: "alice",
          username: "alice",
          profileImage: null,
          avatarCrop: null,
          lastSeen: null,
        },
      ],
      groups: [
        {
          roomId: 101,
          name: "Group 1",
          description: "",
          publicRef: "@group1",
          roomTarget: "@group1",
          memberCount: 2,
          isPublic: true,
        },
      ],
      messages: [
        {
          id: 9,
          publicRef: "alice",
          username: "alice",
          content: "hello",
          createdAt: "2026-01-01T00:00:00.000Z",
          roomId: 101,
          roomName: "Room 1",
          roomKind: "group",
          roomTarget: "@group1",
        },
      ],
    };
    const attachments: RoomAttachmentsResult = {
      items: [
        {
          id: 2,
          originalFilename: "b.txt",
          contentType: "text/plain",
          fileSize: 2,
          url: null,
          thumbnailUrl: null,
          width: null,
          height: null,
          messageId: 22,
          createdAt: "2026-01-01T00:00:00.000Z",
          publicRef: "alice",
          username: "alice",
        },
      ],
      pagination: { limit: 20, hasMore: false, nextBefore: null },
    };

    apiMocks.resolveChatTarget.mockResolvedValue(resolvedChatTarget);
    apiMocks.getUnreadCounts.mockResolvedValue(unreadCounts);
    apiMocks.editMessage.mockResolvedValue(editedMessage);
    apiMocks.deleteMessage.mockResolvedValue(undefined);
    apiMocks.addReaction.mockResolvedValue(reaction);
    apiMocks.removeReaction.mockResolvedValue(undefined);
    apiMocks.searchMessages.mockResolvedValue(search);
    apiMocks.uploadAttachments.mockResolvedValue(upload);
    apiMocks.markRead.mockResolvedValue(readState);
    apiMocks.globalSearch.mockResolvedValue(searchResult);
    apiMocks.getRoomAttachments.mockResolvedValue(attachments);

    const chatController = await loadController();
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    await expect(chatController.resolveChatTarget("@alice")).resolves.toEqual(
      resolvedChatTarget,
    );
    await expect(chatController.getUnreadCounts()).resolves.toEqual(
      unreadCounts,
    );
    await expect(
      chatController.editMessage("room_1", 7, "edited"),
    ).resolves.toEqual(editedMessage);
    await expect(
      chatController.deleteMessage("room_1", 7),
    ).resolves.toBeUndefined();
    await expect(
      chatController.addReaction("room_1", 7, "🔥"),
    ).resolves.toEqual(reaction);
    await expect(
      chatController.removeReaction("room_1", 7, "🔥"),
    ).resolves.toBeUndefined();
    await expect(
      chatController.searchMessages("room_1", "hello"),
    ).resolves.toEqual(search);
    await expect(
      chatController.uploadAttachments("room_1", [file], {
        messageContent: "files",
      }),
    ).resolves.toEqual(upload);
    await expect(chatController.markRead("room_1", 44)).resolves.toEqual(
      readState,
    );
    await expect(
      chatController.globalSearch("alice", {
        usersLimit: 5,
        groupsLimit: 3,
        messagesLimit: 2,
      }),
    ).resolves.toEqual(searchResult);
    await expect(
      chatController.getRoomAttachments("room_1", { limit: 20, before: 100 }),
    ).resolves.toEqual(attachments);

    expect(apiMocks.resolveChatTarget).toHaveBeenCalledWith("@alice");
    expect(apiMocks.getUnreadCounts).toHaveBeenCalledTimes(1);
    expect(apiMocks.editMessage).toHaveBeenCalledWith("room_1", 7, "edited");
    expect(apiMocks.deleteMessage).toHaveBeenCalledWith("room_1", 7);
    expect(apiMocks.addReaction).toHaveBeenCalledWith("room_1", 7, "🔥");
    expect(apiMocks.removeReaction).toHaveBeenCalledWith("room_1", 7, "🔥");
    expect(apiMocks.searchMessages).toHaveBeenCalledWith("room_1", "hello");
    expect(apiMocks.uploadAttachments).toHaveBeenCalledWith("room_1", [file], {
      messageContent: "files",
    });
    expect(apiMocks.markRead).toHaveBeenCalledWith("room_1", 44);
    expect(apiMocks.globalSearch).toHaveBeenCalledWith("alice", {
      usersLimit: 5,
      groupsLimit: 3,
      messagesLimit: 2,
    });
    expect(apiMocks.getRoomAttachments).toHaveBeenCalledWith("room_1", {
      limit: 20,
      before: 100,
    });
  });

  it("splits oversized attachment uploads into several message batches", async () => {
    const firstUpload: UploadResult = {
      id: 10,
      content: "gallery",
      attachments: [],
    };
    const secondUpload: UploadResult = {
      id: 11,
      content: "",
      attachments: [],
    };

    apiMocks.uploadAttachments
      .mockResolvedValueOnce(firstUpload)
      .mockResolvedValueOnce(secondUpload);

    const chatController = await loadController();
    const files = Array.from({ length: 12 }, (_value, index) =>
      new File([String(index + 1)], `${index + 1}.png`, { type: "image/png" }),
    );

    await expect(
      chatController.uploadAttachments("room_1", files, {
        messageContent: "gallery",
        replyTo: 77,
      }),
    ).resolves.toEqual(firstUpload);

    expect(apiMocks.uploadAttachments).toHaveBeenCalledTimes(2);
    expect(
      (apiMocks.uploadAttachments.mock.calls[0]?.[1] as File[]).map(
        (file) => file.name,
      ),
    ).toEqual([
      "1.png",
      "2.png",
      "3.png",
      "4.png",
      "5.png",
      "6.png",
      "7.png",
      "8.png",
      "9.png",
      "10.png",
    ]);
    expect(apiMocks.uploadAttachments.mock.calls[0]?.[2]).toMatchObject({
      messageContent: "gallery",
      replyTo: 77,
    });
    expect(
      (apiMocks.uploadAttachments.mock.calls[1]?.[1] as File[]).map(
        (file) => file.name,
      ),
    ).toEqual(["11.png", "12.png"]);
    expect(apiMocks.uploadAttachments.mock.calls[1]?.[2]).toMatchObject({
      messageContent: undefined,
      replyTo: undefined,
    });
  });
});
