import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Message } from '../entities/message/types'
import type { RoomDetails } from '../entities/room/types'

const wsState = vi.hoisted(() => ({
  status: 'online' as 'online' | 'connecting' | 'offline' | 'error' | 'closed',
  lastError: null as string | null,
  send: vi.fn<(payload: string) => boolean>(),
  options: null as
    | {
        onMessage?: (event: MessageEvent) => void
      }
    | null,
}))

const chatRoomMock = vi.hoisted(() => ({
  details: { slug: 'public', name: 'Public', kind: 'public', created: false, createdBy: null } as RoomDetails,
  messages: [] as Message[],
  loading: false,
  loadingMore: false,
  hasMore: false,
  error: null as string | null,
  loadMore: vi.fn(),
  reload: vi.fn(),
  setMessages: vi.fn(),
}))

const presenceMock = vi.hoisted(() => ({
  online: [] as Array<{ username: string; profileImage: string | null }> ,
  guests: 0,
  status: 'online' as const,
  lastError: null as string | null,
}))

const infoPanelMock = vi.hoisted(() => ({
  open: vi.fn(),
}))

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
}))

const groupControllerMock = vi.hoisted(() => ({
  joinGroup: vi.fn().mockResolvedValue(undefined),
}))

const chatControllerMock = vi.hoisted(() => ({
  editMessage: vi.fn().mockResolvedValue({}),
  deleteMessage: vi.fn().mockResolvedValue(undefined),
  addReaction: vi.fn().mockResolvedValue({}),
  removeReaction: vi.fn().mockResolvedValue(undefined),
  searchMessages: vi.fn().mockResolvedValue({ results: [] }),
  uploadAttachments: vi.fn().mockResolvedValue({}),
  markRead: vi.fn().mockResolvedValue({}),
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '' }),
}))

vi.mock('../hooks/useChatRoom', () => ({
  useChatRoom: () => chatRoomMock,
}))

vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}))

vi.mock('../hooks/useReconnectingWebSocket', () => ({
  useReconnectingWebSocket: (options: unknown) => {
    wsState.options = options as { onMessage?: (event: MessageEvent) => void }
    return {
      status: wsState.status,
      lastError: wsState.lastError,
      send: wsState.send,
      reconnect: vi.fn(),
    }
  },
}))

vi.mock('../shared/presence', () => ({
  usePresence: () => presenceMock,
}))

vi.mock('../hooks/useTypingIndicator', () => ({
  useTypingIndicator: () => ({ sendTyping: vi.fn() }),
}))

vi.mock('../hooks/useRoomPermissions', () => ({
  useRoomPermissions: () => permissionsMock,
}))

vi.mock('../shared/directInbox', () => ({
  useDirectInbox: () => ({ setActiveRoom: vi.fn(), markRead: vi.fn() }),
}))

vi.mock('../shared/config/limits', () => ({
  useChatMessageMaxLength: () => 2000,
}))

vi.mock('../shared/layout/useInfoPanel', () => ({
  useInfoPanel: () => infoPanelMock,
}))

vi.mock('../controllers/ChatController', () => ({
  chatController: chatControllerMock,
}))

vi.mock('../controllers/GroupController', () => ({
  groupController: groupControllerMock,
}))

import { ChatRoomPage } from './ChatRoomPage'

const user = {
  username: 'demo',
  email: 'demo@example.com',
  profileImage: null,
  bio: '',
  lastSeen: null,
  registeredAt: null,
}

describe('ChatRoomPage', () => {
  beforeEach(() => {
    wsState.status = 'online'
    wsState.lastError = null
    wsState.send.mockReset().mockReturnValue(true)
    wsState.options = null

    chatRoomMock.details = { slug: 'public', name: 'Public', kind: 'public', created: false, createdBy: null } as RoomDetails
    chatRoomMock.messages = []
    chatRoomMock.loading = false
    chatRoomMock.loadingMore = false
    chatRoomMock.hasMore = false
    chatRoomMock.error = null
    chatRoomMock.loadMore.mockReset()
    chatRoomMock.reload.mockReset()
    chatRoomMock.setMessages.mockReset()
    permissionsMock.loading = false
    permissionsMock.raw = null
    permissionsMock.isMember = true
    permissionsMock.isBanned = false
    permissionsMock.canJoin = false
    permissionsMock.canRead = true
    permissionsMock.canWrite = true
    permissionsMock.canAttachFiles = true
    permissionsMock.canReact = true
    permissionsMock.canManageMessages = false
    permissionsMock.canManageRoles = false
    permissionsMock.canManageRoom = false
    permissionsMock.canKick = false
    permissionsMock.canBan = false
    permissionsMock.canInvite = false
    permissionsMock.canMute = false
    permissionsMock.isAdmin = false
    permissionsMock.refresh.mockReset().mockResolvedValue(undefined)
    groupControllerMock.joinGroup.mockReset().mockResolvedValue(undefined)
    chatControllerMock.markRead.mockReset().mockResolvedValue({})
    presenceMock.online = []
    presenceMock.status = 'online'
    presenceMock.lastError = null
    infoPanelMock.open.mockReset()
  })

  it('shows read-only mode for guest in public room', () => {
    render(<ChatRoomPage slug="public" user={null} onNavigate={vi.fn()} />)

    expect(screen.getByTestId('chat-auth-callout')).toBeInTheDocument()
    expect(screen.queryByLabelText('Сообщение')).toBeNull()
  })

  it('sends message for authenticated user', () => {
    render(<ChatRoomPage slug="public" user={user} onNavigate={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Сообщение'), {
      target: { value: 'Hello from test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Отправить сообщение' }))

    expect(wsState.send).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(wsState.send.mock.calls[0][0])
    expect(payload.message).toBe('Hello from test')
    expect(payload.username).toBe('demo')
  })

  it('disables submit while websocket is not online', () => {
    wsState.status = 'connecting'

    render(<ChatRoomPage slug="public" user={user} onNavigate={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Сообщение'), { target: { value: 'text' } })

    expect(screen.getByRole('button', { name: 'Отправить сообщение' })).toBeDisabled()
  })

  it('activates local rate limit cooldown from ws error event', () => {
    render(<ChatRoomPage slug="public" user={user} onNavigate={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Сообщение'), { target: { value: 'text' } })
    expect(screen.getByRole('button', { name: 'Отправить сообщение' })).toBeEnabled()

    act(() => {
      wsState.options?.onMessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ error: 'rate_limited', retry_after: 2 }),
        }),
      )
    })

    expect(screen.getByRole('button', { name: 'Отправить сообщение' })).toBeDisabled()
  })

  it('shows online status for direct peer', () => {
    chatRoomMock.details = {
      slug: 'dm_1',
      name: 'dm',
      kind: 'direct',
      created: false,
      createdBy: null,
      peer: { username: 'alice', profileImage: null, lastSeen: '2026-02-13T10:00:00.000Z' },
    } as RoomDetails
    presenceMock.online = [{ username: 'alice', profileImage: null }]

    render(<ChatRoomPage slug="dm_1" user={user} onNavigate={vi.fn()} />)
    expect(screen.getByText('В сети')).toBeInTheDocument()
  })

  it('highlights own messages', () => {
    chatRoomMock.messages = [
      {
        id: 3,
        username: 'demo',
        content: 'mine',
        profilePic: null,
        createdAt: '2026-02-13T12:00:00.000Z',
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      {
        id: 4,
        username: 'alice',
        content: 'other',
        profilePic: null,
        createdAt: '2026-02-13T12:01:00.000Z',
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ]

    const { container } = render(<ChatRoomPage slug="public" user={user} onNavigate={vi.fn()} />)

    expect(container.querySelector('article[data-own-message="true"]')).not.toBeNull()
    expect(container.querySelector('article[data-own-message="false"]')).not.toBeNull()
  })

  it('shows join CTA and hides input for public group non-member', async () => {
    chatRoomMock.details = {
      slug: 'g-public-1',
      name: 'Public Group',
      kind: 'group',
      created: false,
      createdBy: null,
    } as RoomDetails
    permissionsMock.loading = false
    permissionsMock.isMember = false
    permissionsMock.canWrite = false
    permissionsMock.canJoin = true

    render(<ChatRoomPage slug="g-public-1" user={user} onNavigate={vi.fn()} />)

    expect(screen.getByTestId('group-join-callout')).toBeInTheDocument()
    expect(screen.queryByLabelText('Сообщение')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Присоединиться' }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(groupControllerMock.joinGroup).toHaveBeenCalledWith('g-public-1')
    expect(permissionsMock.refresh).toHaveBeenCalledTimes(1)
    expect(chatRoomMock.reload).toHaveBeenCalledTimes(1)
  })

  it('deduplicates mark-read for same last message id', async () => {
    chatRoomMock.details = {
      slug: 'dm_1',
      name: 'dm',
      kind: 'direct',
      created: false,
      createdBy: null,
      peer: { username: 'alice', profileImage: null, lastSeen: null },
    } as RoomDetails
    chatRoomMock.messages = [
      {
        id: 1,
        username: 'alice',
        content: 'first',
        profilePic: null,
        createdAt: '2026-02-13T12:00:00.000Z',
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
      {
        id: 2,
        username: 'alice',
        content: 'second',
        profilePic: null,
        createdAt: '2026-02-13T12:01:00.000Z',
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ]

    const { rerender } = render(<ChatRoomPage slug="dm_1" user={user} onNavigate={vi.fn()} />)

    await act(async () => {
      await Promise.resolve()
    })
    expect(chatControllerMock.markRead).toHaveBeenCalledWith('dm_1', 2)
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(1)

    chatRoomMock.messages = [...chatRoomMock.messages]
    rerender(<ChatRoomPage slug="dm_1" user={user} onNavigate={vi.fn()} />)

    await act(async () => {
      await Promise.resolve()
    })
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(1)

    chatRoomMock.messages = [
      ...chatRoomMock.messages,
      {
        id: 3,
        username: 'alice',
        content: 'third',
        profilePic: null,
        createdAt: '2026-02-13T12:02:00.000Z',
        editedAt: null,
        isDeleted: false,
        replyTo: null,
        attachments: [],
        reactions: [],
      },
    ]
    rerender(<ChatRoomPage slug="dm_1" user={user} onNavigate={vi.fn()} />)

    await act(async () => {
      await Promise.resolve()
    })
    expect(chatControllerMock.markRead).toHaveBeenCalledWith('dm_1', 3)
    expect(chatControllerMock.markRead).toHaveBeenCalledTimes(2)
  })
})
