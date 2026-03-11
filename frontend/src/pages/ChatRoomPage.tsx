import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { chatController } from '../controllers/ChatController'
import { friendsController } from '../controllers/FriendsController'
import { groupController } from '../controllers/GroupController'
import { decodeChatWsEvent } from '../dto'
import type { SearchResultItem } from '../domain/interfaces/IApiService'
import type { Message } from '../entities/message/types'
import type { UserProfile } from '../entities/user/types'
import { useChatRoom } from '../hooks/useChatRoom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useReconnectingWebSocket } from '../hooks/useReconnectingWebSocket'
import { useRoomPermissions } from '../hooks/useRoomPermissions'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { useChatMessageMaxLength } from '../shared/config/limits'
import { invalidateDirectChats, invalidateRoomMessages } from '../shared/cache/cacheManager'
import { useDirectInbox } from '../shared/directInbox'
import { useInfoPanel } from '../shared/layout/useInfoPanel'
import { normalizeAvatarCrop } from '../shared/lib/avatarCrop'
import { debugLog } from '../shared/lib/debug'
import { formatDayLabel, formatLastSeen, formatTimestamp } from '../shared/lib/format'
import { sanitizeText } from '../shared/lib/sanitize'
import { getWebSocketBase } from '../shared/lib/ws'
import { usePresence } from '../shared/presence'
import { Avatar, Button, Modal, Panel, Toast } from '../shared/ui'
import styles from '../styles/pages/ChatRoomPage.module.css'
import { MessageBubble } from '../widgets/chat/MessageBubble'
import { MessageInput } from '../widgets/chat/MessageInput'
import { TypingIndicator } from '../widgets/chat/TypingIndicator'

type ReadReceipt = {
  userId: number
  username: string
  lastReadMessageId: number
}

type Props = {
  slug: string
  user: UserProfile | null
  onNavigate: (path: string) => void
}

const RATE_LIMIT_COOLDOWN_MS = 10_000
const TYPING_TIMEOUT_MS = 5_000
const MAX_HISTORY_JUMP_ATTEMPTS = 60

const isOwnMessage = (message: Message, currentUsername: string | null | undefined) =>
  Boolean(currentUsername && message.username === currentUsername)

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback
  const candidate = error as {
    message?: string
    data?: { error?: string; detail?: string }
  }
  if (candidate.data?.error) return candidate.data.error
  if (candidate.data?.detail) return candidate.data.detail
  if (candidate.message && !candidate.message.includes('status code')) return candidate.message
  return fallback
}

const sameAvatarCrop = (left: Message['avatarCrop'], right: Message['avatarCrop']) => {
  const normalizedLeft = normalizeAvatarCrop(left ?? null)
  const normalizedRight = normalizeAvatarCrop(right ?? null)
  if (!normalizedLeft && !normalizedRight) return true
  if (!normalizedLeft || !normalizedRight) return false
  return (
    normalizedLeft.x === normalizedRight.x
    && normalizedLeft.y === normalizedRight.y
    && normalizedLeft.width === normalizedRight.width
    && normalizedLeft.height === normalizedRight.height
  )
}

export function ChatRoomPage({ slug, user, onNavigate }: Props) {
  const { details, messages, loading, loadingMore, hasMore, error, loadMore, reload, setMessages } = useChatRoom(slug, user)
  const location = useLocation()
  const isPublicRoom = slug === 'public'
  const isOnline = useOnlineStatus()
  const { open: openInfoPanel } = useInfoPanel()
  const { setActiveRoom, markRead } = useDirectInbox()
  const { online: presenceOnline, status: presenceStatus } = usePresence()
  const maxMessageLength = useChatMessageMaxLength()
  const roomPermissions = useRoomPermissions(user ? slug : null)
  const {
    loading: permissionsLoading,
    canWrite: canWriteToRoom,
    canJoin: canJoinRoom,
    isBanned: isBannedInRoom,
    refresh: refreshRoomPermissions,
  } = roomPermissions

  const onlineUsernames = useMemo(
    () => new Set(presenceStatus === 'online' ? presenceOnline.map((e) => e.username) : []),
    [presenceOnline, presenceStatus],
  )

  const [draft, setDraft] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map())
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [readReceipts, setReadReceipts] = useState<Map<number, ReadReceipt>>(new Map())
  const [deleteConfirm, setDeleteConfirm] = useState<Message | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [queuedFiles, setQueuedFiles] = useState<File[]>([])
  const [joinInProgress, setJoinInProgress] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null)
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [newMsgCount, setNewMsgCount] = useState(0)
  const [isHeaderSearchOpen, setHeaderSearchOpen] = useState(false)
  const [headerSearchQuery, setHeaderSearchQuery] = useState('')
  const [headerSearchLoading, setHeaderSearchLoading] = useState(false)
  const [headerSearchResults, setHeaderSearchResults] = useState<SearchResultItem[]>([])

  const [unreadDividerId, setUnreadDividerId] = useState<number | null>(null)
  const initialUnreadScrollDoneRef = useRef(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const headerSearchInputRef = useRef<HTMLInputElement | null>(null)
  const headerSearchTimerRef = useRef<number | null>(null)
  const isAtBottomRef = useRef(true)
  const prependingRef = useRef(false)
  const prevScrollHeightRef = useRef(0)
  const messagesRef = useRef(messages)
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const deepLinkedMessageRef = useRef<number | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const lastReadSentRef = useRef(0)

  const wsUrl = useMemo(() => {
    if (!user && !isPublicRoom) return null
    return `${getWebSocketBase()}/ws/chat/${encodeURIComponent(slug)}/`
  }, [isPublicRoom, slug, user])

  const applyRateLimit = useCallback((cooldownMs: number) => {
    const until = Date.now() + cooldownMs
    setRateLimitUntil((prev) => (prev && prev > until ? prev : until))
    setNow(Date.now())
  }, [])

  const scrollMessageIntoView = useCallback((messageId: number) => {
    const list = listRef.current
    if (!list) return false
    const el = list.querySelector<HTMLElement>(`article[data-message-id="${messageId}"]`)
    if (!el) return false

    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setHighlightedMessageId(messageId)
    window.setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === messageId ? null : prev))
    }, 1800)
    return true
  }, [])

  const ensureMessageLoaded = useCallback(async (messageId: number) => {
    let attempts = 0
    while (
      !messagesRef.current.some((msg) => msg.id === messageId)
      && hasMoreRef.current
      && attempts < MAX_HISTORY_JUMP_ATTEMPTS
    ) {
      if (!loadingMoreRef.current) {
        await loadMore()
      }
      attempts += 1
      await new Promise((resolve) => window.setTimeout(resolve, 70))
    }
    return messagesRef.current.some((msg) => msg.id === messageId)
  }, [loadMore])

  const jumpToMessageById = useCallback(async (messageId: number) => {
    if (scrollMessageIntoView(messageId)) return true
    const loaded = await ensureMessageLoaded(messageId)
    if (!loaded) return false
    await new Promise((resolve) => window.setTimeout(resolve, 40))
    return scrollMessageIntoView(messageId)
  }, [ensureMessageLoaded, scrollMessageIntoView])

  useEffect(() => {
    messagesRef.current = messages
    hasMoreRef.current = hasMore
    loadingMoreRef.current = loadingMore
  }, [hasMore, loadingMore, messages])

  useEffect(() => {
    uploadAbortRef.current?.abort()
    uploadAbortRef.current = null
    lastReadSentRef.current = 0
    setQueuedFiles([])
    setUploadProgress(null)
    initialUnreadScrollDoneRef.current = false
    setUnreadDividerId(null)
  }, [slug])

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (headerSearchTimerRef.current !== null) {
      window.clearTimeout(headerSearchTimerRef.current)
      headerSearchTimerRef.current = null
    }
  }, [slug])

  useEffect(() => {
    return () => {
      if (headerSearchTimerRef.current !== null) {
        window.clearTimeout(headerSearchTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isHeaderSearchOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setHeaderSearchOpen(false)
      setHeaderSearchQuery('')
      setHeaderSearchResults([])
    }
    const onMouseDown = (event: MouseEvent) => {
      if (!searchWrapRef.current) return
      if (searchWrapRef.current.contains(event.target as Node)) return
      setHeaderSearchOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isHeaderSearchOpen])

  useEffect(() => {
    if (!isHeaderSearchOpen) {
      setHeaderSearchLoading(false)
      return
    }
    const query = headerSearchQuery.trim()
    if (headerSearchTimerRef.current !== null) {
      window.clearTimeout(headerSearchTimerRef.current)
      headerSearchTimerRef.current = null
    }
    if (query.length < 2) {
      setHeaderSearchResults([])
      setHeaderSearchLoading(false)
      return
    }
    headerSearchTimerRef.current = window.setTimeout(() => {
      setHeaderSearchLoading(true)
      void chatController
        .searchMessages(slug, query)
        .then((result) => {
          setHeaderSearchResults(result.results)
        })
        .catch(() => {
          setHeaderSearchResults([])
        })
        .finally(() => {
          setHeaderSearchLoading(false)
        })
    }, 260)
  }, [headerSearchQuery, isHeaderSearchOpen, slug])

  useEffect(() => {
    if (!typingUsers.size) return
    const id = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TIMEOUT_MS
      setTypingUsers((prev) => {
        const next = new Map<string, number>()
        for (const [username, ts] of prev) {
          if (ts > cutoff) next.set(username, ts)
        }
        return next.size === prev.size ? prev : next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [typingUsers.size])

  const sendMarkReadIfNeeded = useCallback((lastReadMessageId: number | null | undefined) => {
    if (!user || !lastReadMessageId || lastReadMessageId < 1) return
    if (lastReadMessageId <= lastReadSentRef.current) return
    lastReadSentRef.current = lastReadMessageId
    void chatController.markRead(slug, lastReadMessageId).catch(() => {
      if (lastReadSentRef.current === lastReadMessageId) {
        lastReadSentRef.current = Math.max(0, lastReadMessageId - 1)
      }
    })
  }, [slug, user])

  // Mark room as read when entering
  useEffect(() => {
    if (!user || !slug.startsWith('dm_')) return
    setActiveRoom(slug)
    markRead(slug)
    return () => {
      setActiveRoom(null)
    }
  }, [markRead, setActiveRoom, slug, user])

  // Set unread divider from backend lastReadMessageId on initial load
  useEffect(() => {
    if (initialUnreadScrollDoneRef.current) return
    if (!details?.lastReadMessageId || messages.length === 0 || loading) return
    const lastReadId = details.lastReadMessageId
    const lastMsg = messages[messages.length - 1]
    // All messages are already read — no divider needed
    if (!lastMsg || lastMsg.id <= lastReadId) return
    // Find first unread message from OTHER users (skip own messages)
    const currentUsername = user?.username
    const firstUnread = messages.find((m) =>
      m.id > lastReadId && m.username !== currentUsername,
    )
    if (firstUnread) {
      setUnreadDividerId(firstUnread.id)
    }
  }, [details?.lastReadMessageId, loading, messages, user?.username])

  // Scroll to unread divider on initial load
  useEffect(() => {
    if (initialUnreadScrollDoneRef.current || loading || !unreadDividerId) return
    initialUnreadScrollDoneRef.current = true
    requestAnimationFrame(() => {
      const list = listRef.current
      if (!list) return
      const el = list.querySelector<HTMLElement>('[data-unread-divider]')
      if (el) {
        el.scrollIntoView({ block: 'center' })
        isAtBottomRef.current = false
        setShowScrollFab(true)
      }
    })
  }, [loading, unreadDividerId])

  // Send read receipt to backend when messages load or new messages arrive while at bottom
  useEffect(() => {
    if (!user || messages.length === 0) return
    if (!isAtBottomRef.current) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.id < 1) return
    sendMarkReadIfNeeded(lastMsg.id)
  }, [messages, sendMarkReadIfNeeded, user])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const raw = searchParams.get('message')
    if (!raw) {
      deepLinkedMessageRef.current = null
      return
    }
    const targetId = Number(raw)
    if (!Number.isFinite(targetId) || targetId < 1) return
    if (deepLinkedMessageRef.current === targetId) return
    deepLinkedMessageRef.current = targetId
    void jumpToMessageById(targetId)
  }, [jumpToMessageById, location.search])

  const handleMessage = useCallback((event: MessageEvent) => {
    const decoded = decodeChatWsEvent(event.data)

    switch (decoded.type) {
      case 'rate_limited': {
        const retryAfter = Number(decoded.retryAfterSeconds ?? NaN)
        const cooldownMs = Number.isFinite(retryAfter)
          ? Math.max(1, retryAfter) * 1000
          : RATE_LIMIT_COOLDOWN_MS
        applyRateLimit(cooldownMs)
        break
      }
      case 'message_too_long':
        setRoomError(`Сообщение слишком длинное (макс ${maxMessageLength} символов)`)
        break
      case 'forbidden':
        setRoomError('Недостаточно прав для отправки сообщения')
        break
      case 'chat_message': {
        const content = sanitizeText(decoded.message.content, maxMessageLength)
        const hasAttachments = (decoded.message.attachments ?? []).length > 0
        if (!content && !hasAttachments) return
        if (typeof decoded.message.id !== 'number') {
          debugLog('WS chat_message without server id', decoded.message)
          return
        }
        const messageId = decoded.message.id
        invalidateRoomMessages(slug)
        if (details?.kind === 'direct') invalidateDirectChats()

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === messageId)) return prev
          return [
            ...prev,
            {
              id: messageId,
              username: decoded.message.username,
              content,
              profilePic: decoded.message.profilePic || null,
              avatarCrop: decoded.message.avatarCrop ?? null,
              createdAt: decoded.message.createdAt ?? new Date().toISOString(),
              editedAt: null,
              isDeleted: false,
              replyTo: decoded.message.replyTo ?? null,
              attachments: decoded.message.attachments ?? [],
              reactions: [],
            },
          ]
        })

        if (!isAtBottomRef.current && decoded.message.username !== user?.username) {
          setNewMsgCount((count) => count + 1)
          setUnreadDividerId((prev) => prev ?? messageId)
        }

        setTypingUsers((prev) => {
          if (!prev.has(decoded.message.username)) return prev
          const next = new Map(prev)
          next.delete(decoded.message.username)
          return next
        })
        break
      }
      case 'typing':
        if (decoded.username !== user?.username) {
          setTypingUsers((prev) => {
            const next = new Map(prev)
            next.set(decoded.username, Date.now())
            return next
          })
        }
        break
      case 'message_edit':
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === decoded.messageId
              ? { ...msg, content: decoded.content, editedAt: decoded.editedAt }
              : msg,
          ),
        )
        break
      case 'message_delete':
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === decoded.messageId
              ? { ...msg, isDeleted: true, content: '' }
              : msg,
          ),
        )
        break
      case 'reaction_add':
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== decoded.messageId) return msg
            const existing = msg.reactions.find((r) => r.emoji === decoded.emoji)
            const isMe = decoded.username === user?.username
            if (existing) {
              return {
                ...msg,
                reactions: msg.reactions.map((r) =>
                  r.emoji === decoded.emoji
                    ? { ...r, count: r.count + 1, me: r.me || isMe }
                    : r,
                ),
              }
            }
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji: decoded.emoji, count: 1, me: isMe }],
            }
          }),
        )
        break
      case 'reaction_remove':
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== decoded.messageId) return msg
            const isMe = decoded.username === user?.username
            return {
              ...msg,
              reactions: msg.reactions
                .map((r) =>
                  r.emoji === decoded.emoji
                    ? { ...r, count: r.count - 1, me: isMe ? false : r.me }
                    : r,
                )
                .filter((r) => r.count > 0),
            }
          }),
        )
        break
      case 'read_receipt':
        setReadReceipts((prev) => {
          const next = new Map(prev)
          next.set(decoded.userId, {
            userId: decoded.userId,
            username: decoded.username,
            lastReadMessageId: decoded.lastReadMessageId,
          })
          return next
        })
        break
      default:
        debugLog('WS payload parse failed', event.data)
    }
  }, [applyRateLimit, details?.kind, maxMessageLength, setMessages, slug, user?.username])

  const { status, lastError, send } = useReconnectingWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onOpen: () => setRoomError(null),
    onClose: (event) => {
      if (event.code !== 1000 && event.code !== 1001) {
        setRoomError('Соединение потеряно. Пытаемся восстановить...')
      }
    },
    onError: () => setRoomError('Ошибка соединения'),
  })

  const { sendTyping } = useTypingIndicator(send)

  useEffect(() => {
    if (!rateLimitUntil) return
    const id = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= rateLimitUntil) window.clearInterval(id)
    }, 250)
    return () => window.clearInterval(id)
  }, [rateLimitUntil])

  useEffect(() => {
    if (!user) return
    const nextProfile = user.profileImage || null
    const nextAvatarCrop = user.avatarCrop ?? null
    const username = user.username
    setMessages((prev) => {
      let changed = false
      const updated = prev.map((msg) => {
        if (msg.username !== username) return msg
        if (msg.profilePic === nextProfile && sameAvatarCrop(msg.avatarCrop, nextAvatarCrop)) return msg
        changed = true
        return { ...msg, profilePic: nextProfile, avatarCrop: nextAvatarCrop }
      })
      return changed ? updated : prev
    })
  }, [setMessages, user])

  const handleScroll = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const { scrollTop, scrollHeight, clientHeight } = list
    const atBottom = scrollHeight - scrollTop - clientHeight < 80
    isAtBottomRef.current = atBottom
    setShowScrollFab(!atBottom)
    if (atBottom) {
      setNewMsgCount(0)
      // Send read receipt when user scrolls to bottom
      const lastMsg = messagesRef.current[messagesRef.current.length - 1]
      if (lastMsg && lastMsg.id >= 1) {
        sendMarkReadIfNeeded(lastMsg.id)
      }
    }

    if (scrollTop < 120 && hasMore && !loadingMore && !loading) {
      prependingRef.current = true
      prevScrollHeightRef.current = scrollHeight
      void loadMore()
    }
  }, [hasMore, loadMore, loading, loadingMore, sendMarkReadIfNeeded])

  const scrollToBottom = useCallback(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
    setNewMsgCount(0)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    if (prependingRef.current) {
      const delta = list.scrollHeight - prevScrollHeightRef.current
      list.scrollTop += delta
      prependingRef.current = false
      return
    }

    // Don't auto-scroll to bottom if we're about to scroll to unread divider
    if (!initialUnreadScrollDoneRef.current && unreadDividerId) return

    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        list.scrollTop = list.scrollHeight
      })
    }
  }, [messages, unreadDividerId])

  const rateLimitRemainingMs = rateLimitUntil ? Math.max(0, rateLimitUntil - now) : 0
  const rateLimitActive = rateLimitRemainingMs > 0
  const rateLimitSeconds = Math.ceil(rateLimitRemainingMs / 1000)

  const sendMessage = useCallback(async () => {
    if (!user) {
      setRoomError('Авторизуйтесь, чтобы отправлять сообщения')
      return
    }

    const raw = draft
    const hasQueuedFiles = queuedFiles.length > 0
    if (!raw.trim() && !hasQueuedFiles) return

    if (rateLimitActive) {
      setRoomError(`Слишком часто. Подождите ${rateLimitSeconds} сек.`)
      return
    }
    if (raw.length > maxMessageLength) {
      setRoomError(`Сообщение слишком длинное (макс ${maxMessageLength} символов)`)
      return
    }
    if (!isOnline || status !== 'online') {
      setRoomError('Нет соединения с сервером')
      return
    }

    if (editingMessage) {
      if (hasQueuedFiles) {
        setRoomError('Уберите вложения для редактирования сообщения')
        return
      }
      const originalContent = editingMessage.content
      const originalEditedAt = editingMessage.editedAt
      const editedContent = raw.trim()
      const editedId = editingMessage.id

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editedId
            ? { ...msg, content: editedContent, editedAt: new Date().toISOString() }
            : msg,
        ),
      )
      setEditingMessage(null)
      setDraft('')

      void chatController.editMessage(slug, editedId, editedContent).catch((err) => {
        debugLog('Edit failed', err)
        setRoomError('Не удалось отредактировать сообщение')
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editedId
              ? { ...msg, content: originalContent, editedAt: originalEditedAt }
              : msg,
          ),
        )
      })
      return
    }

    const cleaned = sanitizeText(raw, maxMessageLength)

    if (hasQueuedFiles) {
      const abortController = new AbortController()
      uploadAbortRef.current = abortController
      setUploadProgress(0)
      try {
        await chatController.uploadAttachments(slug, queuedFiles, {
          messageContent: cleaned,
          replyTo: replyTo?.id ?? null,
          onProgress: (pct) => setUploadProgress(pct),
          signal: abortController.signal,
        })
        setDraft('')
        setReplyTo(null)
        setQueuedFiles([])
      } catch (err) {
        if (!abortController.signal.aborted) {
          debugLog('Upload failed', err)
          setRoomError(extractApiErrorMessage(err, 'Не удалось загрузить файлы'))
        }
      } finally {
        uploadAbortRef.current = null
        setUploadProgress(null)
      }
      return
    }

    if (!cleaned) return

    const payload: Record<string, unknown> = {
      message: cleaned,
      username: user.username,
      profile_pic: user.profileImage,
      room: slug,
    }
    if (replyTo) payload.replyTo = replyTo.id

    if (!send(JSON.stringify(payload))) {
      setRoomError('Не удалось отправить сообщение')
      return
    }

    setDraft('')
    setReplyTo(null)
  }, [
    draft,
    editingMessage,
    isOnline,
    maxMessageLength,
    queuedFiles,
    rateLimitActive,
    rateLimitSeconds,
    replyTo,
    send,
    setMessages,
    slug,
    status,
    user,
  ])

  const handleReply = useCallback((msg: Message) => {
    setReplyTo(msg)
    setEditingMessage(null)
  }, [])

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage(msg)
    setDraft(msg.content)
    setReplyTo(null)
  }, [])

  const handleDelete = useCallback((msg: Message) => {
    setDeleteConfirm(msg)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return
    const msgId = deleteConfirm.id
    const originalMsg = deleteConfirm

    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, isDeleted: true, content: '' } : msg)),
    )
    setDeleteConfirm(null)

    void chatController.deleteMessage(slug, msgId).catch((err) => {
      debugLog('Delete failed', err)
      setRoomError('Не удалось удалить сообщение')
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, isDeleted: false, content: originalMsg.content }
            : msg,
        ),
      )
    })
  }, [deleteConfirm, setMessages, slug])

  const handleReact = useCallback((msgId: number, emoji: string) => {
    const msg = messages.find((m) => m.id === msgId)
    const existing = msg?.reactions.find((r) => r.emoji === emoji)
    if (existing?.me) {
      void chatController.removeReaction(slug, msgId, emoji).catch((err) => debugLog('Remove reaction failed', err))
    } else {
      void chatController.addReaction(slug, msgId, emoji).catch((err) => debugLog('Add reaction failed', err))
    }
  }, [messages, slug])

  const handleAttach = useCallback((files: File[]) => {
    setQueuedFiles((prev) => [...prev, ...files])
  }, [])

  const handleRemoveQueuedFile = useCallback((index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearQueuedFiles = useCallback(() => {
    setQueuedFiles([])
  }, [])

  const handleCancelUpload = useCallback(() => {
    uploadAbortRef.current?.abort()
    uploadAbortRef.current = null
    setUploadProgress(null)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
    setEditingMessage((prev) => {
      if (prev) setDraft('')
      return null
    })
  }, [])

  const handleReplyQuoteClick = useCallback((messageId: number) => {
    void jumpToMessageById(messageId).then((found) => {
      if (!found) {
        setRoomError('Не удалось найти сообщение в истории')
      }
    })
  }, [jumpToMessageById])

  const openUserProfile = useCallback((username: string) => {
    if (!username) return
    openInfoPanel('profile', username)
  }, [openInfoPanel])

  const openDirectInfo = useCallback(() => {
    if (!details?.peer?.username) return
    openInfoPanel('direct', slug)
  }, [details?.peer?.username, openInfoPanel, slug])

  const openGroupInfo = useCallback(() => {
    if (details?.kind !== 'group') return
    openInfoPanel('group', slug)
  }, [details?.kind, openInfoPanel, slug])

  const handleJoinGroup = useCallback(async () => {
    if (!user) {
      setRoomError('Авторизуйтесь, чтобы присоединиться к группе')
      return
    }
    setJoinInProgress(true)
    setRoomError(null)
    try {
      await groupController.joinGroup(slug)
      reload()
      await refreshRoomPermissions()
    } catch (err) {
      setRoomError(extractApiErrorMessage(err, 'Не удалось присоединиться к группе'))
    } finally {
      setJoinInProgress(false)
    }
  }, [refreshRoomPermissions, reload, slug, user])

  const openRoomSearch = useCallback(() => {
    setHeaderSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        setHeaderSearchQuery('')
        setHeaderSearchResults([])
      } else {
        window.setTimeout(() => headerSearchInputRef.current?.focus(), 0)
      }
      return next
    })
  }, [])

  const onHeaderSearchResultClick = useCallback(
    (messageId: number) => {
      setHeaderSearchOpen(false)
      setHeaderSearchQuery('')
      setHeaderSearchResults([])
      void jumpToMessageById(messageId).then((found) => {
        if (!found) {
          setRoomError('Не удалось найти сообщение в истории')
        }
      })
    },
    [jumpToMessageById],
  )

  const loadError = error ? 'Не удалось загрузить комнату' : null
  const visibleError = roomError || loadError

  const timeline = useMemo(() => {
    type TimelineItem =
      | { type: 'day'; key: string; label: string }
      | { type: 'message'; message: Message }
      | { type: 'unread' }
    const items: TimelineItem[] = []
    const nowDate = new Date()
    let lastKey: string | null = null
    let unreadInserted = false

    for (const msg of messages) {
      if (!unreadInserted && unreadDividerId && msg.id === unreadDividerId) {
        items.push({ type: 'unread' })
        unreadInserted = true
      }
      const date = new Date(msg.createdAt)
      if (!Number.isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        if (key !== lastKey) {
          const label = formatDayLabel(date, nowDate)
          if (label) {
            items.push({ type: 'day', key, label })
            lastKey = key
          }
        }
      }
      items.push({ type: 'message', message: msg })
    }

    return items
  }, [messages, unreadDividerId])

  const activeTypingUsers = useMemo(
    () => Array.from(typingUsers.keys()),
    [typingUsers],
  )

  const directPeerIsTyping = Boolean(
    details?.kind === 'direct'
      && details.peer?.username
      && typingUsers.has(details.peer.username),
  )

  const roomTitle = details?.kind === 'direct'
    ? details.peer?.username ?? details.name
    : details?.name ?? slug

  const groupTypingLabel = useMemo(() => {
    if (details?.kind !== 'group' || activeTypingUsers.length === 0) return null
    if (activeTypingUsers.length === 1) return `${activeTypingUsers[0]} печатает...`
    if (activeTypingUsers.length === 2) return `${activeTypingUsers[0]} и ${activeTypingUsers[1]} печатают...`
    return `${activeTypingUsers[0]} и ещё ${activeTypingUsers.length - 1} печатают...`
  }, [activeTypingUsers, details?.kind])

  const isBlocked = Boolean(details?.blocked)
  const isBlockedByMe = Boolean(details?.blockedByMe)
  const isGroupRoom = details?.kind === 'group'
  const isGroupReadOnly = Boolean(
    user
    && isGroupRoom
    && !permissionsLoading
    && !canWriteToRoom,
  )
  const showGroupJoinCta = isGroupReadOnly && canJoinRoom
  const showGroupReadOnlyNotice = isGroupReadOnly && !canJoinRoom
  const canSendMessages = Boolean(
    user
    && !isBlocked
    && (!isGroupRoom || canWriteToRoom),
  )

  const roomSubtitle = details?.kind === 'direct'
    ? (isBlocked
        ? 'Был(а) в сети давно'
        : directPeerIsTyping
          ? 'Печатает...'
          : details.peer?.username && onlineUsernames.has(details.peer.username)
            ? 'В сети'
            : `Был(а) в сети: ${formatLastSeen(details.peer?.lastSeen ?? null) || '—'}`)
    : details?.kind === 'group'
      ? (groupTypingLabel ?? 'Групповой чат')
      : (details?.createdBy ? `Создатель: ${details.createdBy}` : 'Чат')

  const maxReadMessageId = useMemo(() => {
    let maxId = 0
    for (const receipt of readReceipts.values()) {
      if (receipt.username !== user?.username && receipt.lastReadMessageId > maxId) {
        maxId = receipt.lastReadMessageId
      }
    }
    return maxId
  }, [readReceipts, user?.username])

  if (!user && !isPublicRoom) {
    return (
      <Panel>
        <p>Чтобы войти в комнату, авторизуйтесь.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => onNavigate('/login')}>Войти</Button>
          <Button variant="ghost" onClick={() => onNavigate('/register')}>Регистрация</Button>
        </div>
      </Panel>
    )
  }

  return (
    <div className={styles.chat}>
      {!isOnline && (
        <Toast variant="warning" role="status">
          Нет подключения к интернету. Мы восстановим соединение автоматически.
        </Toast>
      )}

      {lastError && status === 'error' && (
        <Toast variant="danger" role="alert">
          Проблемы с соединением. Проверьте сеть и попробуйте еще раз.
        </Toast>
      )}

      <div className={styles.chatHeader}>
        <div className={styles.directHeader}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={() => onNavigate('/')}
            aria-label="Назад"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {details?.kind === 'direct' && details.peer ? (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={openDirectInfo}
              aria-label={`Профиль ${details.peer.username}`}
            >
              <Avatar
                username={details.peer.username}
                profileImage={details.peer.profileImage}
                avatarCrop={details.peer.avatarCrop}
                online={onlineUsernames.has(details.peer.username)}
                size="small"
              />
            </button>
          ) : (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={details?.kind === 'group' ? openGroupInfo : undefined}
              disabled={details?.kind !== 'group'}
              aria-label={details?.kind === 'group' ? 'Информация о группе' : 'Информация о чате'}
            >
              <Avatar
                username={roomTitle}
                profileImage={details?.kind === 'group' ? (details.avatarUrl ?? null) : null}
                avatarCrop={details?.kind === 'group' ? (details.avatarCrop ?? undefined) : undefined}
                size="small"
              />
            </button>
          )}

          <div className={styles.directHeaderMeta}>
            <strong className={styles.directHeaderName}>{roomTitle}</strong>
            <p className={styles.muted}>{roomSubtitle}</p>
          </div>

          <div ref={searchWrapRef} className={styles.directHeaderActions}>
            <button
              type="button"
              className={[styles.headerIconBtn, isHeaderSearchOpen ? styles.headerIconBtnActive : ''].filter(Boolean).join(' ')}
              onClick={openRoomSearch}
              aria-label="Поиск по чату"
              title="Поиск по чату"
              aria-expanded={isHeaderSearchOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {details?.kind === 'group' && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openGroupInfo}
                aria-label="Информация о группе"
                title="Информация о группе"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            )}

            {details?.kind === 'direct' && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openDirectInfo}
                aria-label="Информация о пользователе"
                title="Информация о пользователе"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}

            <div
              className={[
                styles.headerSearch,
                isHeaderSearchOpen ? styles.headerSearchOpen : '',
              ].filter(Boolean).join(' ')}
              aria-hidden={!isHeaderSearchOpen}
            >
              <div className={styles.headerSearchInputRow}>
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  className={styles.headerSearchInput}
                  value={headerSearchQuery}
                  onChange={(event) => setHeaderSearchQuery(event.target.value)}
                  placeholder="Поиск в этом чате"
                />
                <button
                  type="button"
                  className={styles.headerSearchClose}
                  onClick={() => {
                    setHeaderSearchOpen(false)
                    setHeaderSearchQuery('')
                    setHeaderSearchResults([])
                  }}
                  aria-label="Закрыть поиск"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className={styles.headerSearchResults}>
                {headerSearchLoading && <div className={styles.headerSearchState}>Ищем...</div>}
                {!headerSearchLoading && headerSearchQuery.trim().length >= 2 && headerSearchResults.length === 0 && (
                  <div className={styles.headerSearchState}>Ничего не найдено</div>
                )}
                {!headerSearchLoading && headerSearchResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={styles.headerSearchResult}
                    onClick={() => onHeaderSearchResultClick(item.id)}
                  >
                    <span className={styles.headerSearchResultTop}>
                      <strong>{item.username}</strong>
                      <time>{formatTimestamp(item.createdAt)}</time>
                    </span>
                    <span className={styles.headerSearchResultText}>{item.content || 'Вложение'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {visibleError && <Toast variant="danger">{visibleError}</Toast>}

      {loading ? (
        <Panel muted busy>Загружаем историю...</Panel>
      ) : (
        <div className={styles.chatBox}>
          <div className={styles.chatLog} ref={listRef} aria-live="polite" onScroll={handleScroll}>
            {loadingMore && <Panel muted busy>Загружаем ранние сообщения...</Panel>}
            {!hasMore && <Panel muted>Это начало истории.</Panel>}

            {timeline.map((item) =>
              item.type === 'day' ? (
                <div className={styles.daySeparator} role="separator" aria-label={item.label} key={`day-${item.key}`}>
                  <span>{item.label}</span>
                </div>
              ) : item.type === 'unread' ? (
                <div className={styles.unreadDivider} role="separator" key="unread-divider" data-unread-divider>
                  <span>Новые сообщения</span>
                </div>
              ) : (
                <MessageBubble
                  key={`${item.message.id}-${item.message.createdAt}`}
                  message={item.message}
                  isOwn={isOwnMessage(item.message, user?.username)}
                  isRead={isOwnMessage(item.message, user?.username) && item.message.id <= maxReadMessageId}
                  highlighted={item.message.id === highlightedMessageId}
                  onlineUsernames={onlineUsernames}
                  onReply={user ? handleReply : undefined}
                  onEdit={isOwnMessage(item.message, user?.username) ? handleEdit : undefined}
                  onDelete={isOwnMessage(item.message, user?.username) ? handleDelete : undefined}
                  onReact={user ? handleReact : undefined}
                  onReplyQuoteClick={handleReplyQuoteClick}
                  onAvatarClick={openUserProfile}
                />
              ),
            )}
          </div>

          {showScrollFab && (
            <button
              type="button"
              className={styles.scrollFab}
              onClick={scrollToBottom}
              aria-label="Прокрутить вниз"
            >
              {newMsgCount > 0 && <span className={styles.scrollFabBadge}>{newMsgCount}</span>}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          {activeTypingUsers.length > 0 && (
            <TypingIndicator users={activeTypingUsers} />
          )}

          {!user && isPublicRoom && (
            <div className={styles.authCallout} data-testid="chat-auth-callout">
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>Чтобы писать в публичном чате, войдите или зарегистрируйтесь.</p>
              </div>
            </div>
          )}

          {user && isBlocked && isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>Вы заблокировали этого пользователя.</p>
              </div>
              <Button variant="primary" onClick={() => {
                const peerId = details?.peer?.userId
                if (!peerId) return
                void friendsController.unblockUser(peerId)
                  .then(() => window.location.reload())
                  .catch(() => {})
              }}>Разблокировать</Button>
            </div>
          )}

          {user && isBlocked && !isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>Вы не можете писать этому пользователю.</p>
              </div>
            </div>
          )}

          {user && showGroupJoinCta && (
            <div className={styles.authCallout} data-testid="group-join-callout">
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>Чтобы отправлять сообщения, сначала присоединитесь к группе.</p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  void handleJoinGroup()
                }}
                disabled={joinInProgress || permissionsLoading}
              >
                {joinInProgress ? 'Присоединяемся...' : 'Присоединиться'}
              </Button>
            </div>
          )}

          {user && showGroupReadOnlyNotice && (
            <div className={styles.authCallout} data-testid="group-readonly-callout">
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  {isBannedInRoom ? 'Вы заблокированы в этой группе.' : 'У вас нет прав на отправку сообщений в этой группе.'}
                </p>
              </div>
            </div>
          )}

          {canSendMessages && (
            <MessageInput
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => {
                void sendMessage()
              }}
              onTyping={sendTyping}
              disabled={status !== 'online' || !isOnline}
              rateLimitActive={rateLimitActive}
              rateLimitSeconds={rateLimitSeconds}
              replyTo={editingMessage ?? replyTo}
              onCancelReply={handleCancelReply}
              onAttach={handleAttach}
              pendingFiles={queuedFiles}
              onRemovePendingFile={handleRemoveQueuedFile}
              onClearPendingFiles={handleClearQueuedFiles}
              uploadProgress={uploadProgress}
              onCancelUpload={handleCancelUpload}
            />
          )}
        </div>
      )}

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удалить сообщение?">
        <p style={{ color: 'var(--tg-text-secondary, #aaa)', marginBottom: 16, fontSize: 14 }}>
          Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
          <Button variant="primary" onClick={confirmDelete}>Удалить</Button>
        </div>
      </Modal>
    </div>
  )
}
