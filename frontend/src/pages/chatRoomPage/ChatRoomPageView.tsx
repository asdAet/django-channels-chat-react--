import { friendsController } from "../../controllers/FriendsController";
import { formatTimestamp } from "../../shared/lib/format";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import {
  Avatar,
  Button,
  ImageLightbox,
  Modal,
  Panel,
  Toast,
} from "../../shared/ui";
import styles from "../../styles/pages/ChatRoomPage.module.css";
import { MessageBubble } from "../../widgets/chat/MessageBubble";
import { MessageInput } from "../../widgets/chat/MessageInput";
import { ReadersMenu } from "../../widgets/chat/ReadersMenu";
import { TypingIndicator } from "../../widgets/chat/TypingIndicator";
import type { ChatRoomPageViewProps } from "./ChatRoomPageView.types";
import {
  isOwnMessage,
  normalizeActorRef,
  resolveMessageActorRef,
} from "./utils";

/**
 * Презентационный слой страницы комнаты.
 *
 * @param props Подготовленные данные контроллера и маршрутные колбэки.
 * @returns Полная разметка страницы комнаты.
 */
export function ChatRoomPageView({
  controller,
  onNavigate,
  user,
}: ChatRoomPageViewProps) {
  const { room, headerSearch, scroll, composer, actions, view, fileDrop } =
    controller;
  const {
    details,
    loading,
    loadingMore,
    isPublicRoom,
    isOnline,
    canManageMessagesToRoom,
    permissionsLoading,
    isBannedInRoom,
    visibleError,
    status,
    lastError,
    currentActorRef,
  } = room;
  const {
    searchWrapRef,
    headerSearchInputRef,
    isHeaderSearchOpen,
    headerSearchQuery,
    headerSearchLoading,
    headerSearchResults,
    setHeaderSearchQuery,
    openRoomSearch,
    closeRoomSearch,
    onHeaderSearchResultClick,
  } = headerSearch;
  const {
    listRef,
    highlightedMessageId,
    showScrollFab,
    newMsgCount,
    unreadDividerAnchorId,
    handleScroll,
    armPaginationInteraction,
    scrollToBottom,
  } = scroll;
  const {
    draft,
    setDraft,
    replyTo,
    editingMessage,
    deleteConfirm,
    setDeleteConfirm,
    readersMenu,
    uploadProgress,
    queuedFiles,
    joinInProgress,
    lightboxAttachmentId,
    setLightboxAttachmentId,
    sendMessage,
    handleReply,
    handleEdit,
    handleDelete,
    closeReadersMenu,
    handleOpenReaders,
    confirmDelete,
    handleReact,
    handleAttach,
    handleRemoveQueuedFile,
    handleClearQueuedFiles,
    handleCancelUpload,
    handleCancelReply,
    handleReplyQuoteClick,
    handleJoinGroup,
    handleOpenMediaAttachment,
    sendTyping,
    rateLimitActive,
  } = composer;
  const {
    openUserProfile,
    openDirectInfo,
    openGroupInfo,
    handleMobileOpenClick,
  } = actions;
  const {
    onlineUsernames,
    timeline,
    lightboxMediaItems,
    lightboxOpenIndex,
    activeTypingUsers,
    roomTitle,
    roomSubtitle,
    isBlocked,
    isBlockedByMe,
    showGroupJoinCta,
    showGroupReadOnlyNotice,
    canSendMessages,
    maxReadMessageId,
    readersMenuEntries,
  } = view;
  const { isDropTargetActive, fileDropBindings } = fileDrop;

  if (!user && !isPublicRoom) {
    return (
      <Panel>
        <p>Чтобы войти в комнату, авторизуйтесь.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => onNavigate("/login")}>
            Войти
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("/register")}>
            Регистрация
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div
      className={[styles.chat, isDropTargetActive ? styles.chatDragActive : ""]
        .filter(Boolean)
        .join(" ")}
      data-testid="chat-page-root"
      {...fileDropBindings}
    >
      {isDropTargetActive && (
        <div
          className={styles.dropOverlay}
          role="status"
          aria-live="polite"
          data-testid="chat-drop-overlay"
        >
          <div className={styles.dropOverlayContent}>
            <strong>Отпустите файл, чтобы прикрепить</strong>
            <span>Можно перетащить сразу несколько файлов</span>
          </div>
        </div>
      )}

      {!isOnline && (
        <Toast variant="warning" role="status">
          Нет подключения к интернету. Мы восстановим соединение автоматически.
        </Toast>
      )}

      {lastError && status === "error" && (
        <Toast variant="danger" role="alert">
          Проблемы с соединением. Проверьте сеть и попробуйте еще раз.
        </Toast>
      )}

      <div className={styles.chatHeader}>
        <div className={styles.directHeader}>
          <div className={styles.mobileHeaderButtons}>
            <button
              type="button"
              className={styles.mobileBackBtn}
              onClick={handleMobileOpenClick}
              aria-label="Открыть меню"
              data-testid="chat-mobile-open-button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          {details?.kind === "direct" && details.peer ? (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={openDirectInfo}
              aria-label={`Профиль ${resolveIdentityLabel(details.peer)}`}
            >
              <Avatar
                username={resolveIdentityLabel(details.peer)}
                profileImage={details.peer.profileImage}
                avatarCrop={details.peer.avatarCrop}
                online={onlineUsernames.has(
                  normalizeActorRef(details.peer.publicRef),
                )}
                size="small"
              />
            </button>
          ) : (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={details?.kind === "group" ? openGroupInfo : undefined}
              disabled={details?.kind !== "group"}
              aria-label={
                details?.kind === "group"
                  ? "Информация о группе"
                  : "Информация о чате"
              }
            >
              <Avatar
                username={roomTitle}
                profileImage={
                  details?.kind === "group" ? (details.avatarUrl ?? null) : null
                }
                avatarCrop={
                  details?.kind === "group"
                    ? (details.avatarCrop ?? undefined)
                    : undefined
                }
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
              className={[
                styles.headerIconBtn,
                isHeaderSearchOpen ? styles.headerIconBtnActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={openRoomSearch}
              aria-label="Поиск по чату"
              title="Поиск по чату"
              aria-expanded={isHeaderSearchOpen}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {details?.kind === "group" && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openGroupInfo}
                aria-label="Информация о группе"
                title="Информация о группе"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            )}

            {details?.kind === "direct" && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openDirectInfo}
                aria-label="Информация о пользователе"
                title="Информация о пользователе"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}

            <div
              className={[
                styles.headerSearch,
                isHeaderSearchOpen ? styles.headerSearchOpen : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
                  onClick={closeRoomSearch}
                  aria-label="Закрыть поиск"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className={styles.headerSearchResults}>
                {headerSearchLoading && (
                  <div className={styles.headerSearchState}>Ищем...</div>
                )}
                {!headerSearchLoading &&
                  headerSearchQuery.trim().length >= 2 &&
                  headerSearchResults.length === 0 && (
                    <div className={styles.headerSearchState}>
                      Ничего не найдено
                    </div>
                  )}
                {!headerSearchLoading &&
                  headerSearchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={styles.headerSearchResult}
                      onClick={() => onHeaderSearchResultClick(item.id)}
                    >
                      <span className={styles.headerSearchResultTop}>
                        <strong>{resolveIdentityLabel(item)}</strong>
                        <time>{formatTimestamp(item.createdAt)}</time>
                      </span>
                      <span className={styles.headerSearchResultText}>
                        {item.content || "Вложение"}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {visibleError && <Toast variant="danger">{visibleError}</Toast>}

      {loading ? (
        <Panel muted busy>
          Загружаем историю...
        </Panel>
      ) : (
        <div className={styles.chatBox}>
          <div
            className={styles.chatLog}
            ref={listRef}
            aria-live="polite"
            onScroll={handleScroll}
            onWheel={armPaginationInteraction}
            onTouchStart={armPaginationInteraction}
            onPointerDown={armPaginationInteraction}
          >
            {loadingMore && (
              <Panel muted busy>
                Загружаем ранние сообщения...
              </Panel>
            )}

            {timeline.map((item, index) =>
              item.type === "day" ? (
                <div
                  className={styles.daySeparator}
                  role="separator"
                  aria-label={item.label}
                  key={`day-${item.key}`}
                >
                  <span>{item.label}</span>
                </div>
              ) : item.type === "unread" ? (
                <div
                  className={styles.unreadDivider}
                  role="separator"
                  key="unread-divider"
                  data-unread-divider
                  data-unread-anchor-id={unreadDividerAnchorId ?? ""}
                >
                  <span>Новые сообщения</span>
                </div>
              ) : (
                (() => {
                  const previousTimelineItem = timeline[index - 1];
                  const previousMessage =
                    previousTimelineItem?.type === "message"
                      ? previousTimelineItem.message
                      : null;
                  const grouped =
                    previousMessage !== null &&
                    resolveMessageActorRef(previousMessage) ===
                      resolveMessageActorRef(item.message);
                  const ownMessage = isOwnMessage(
                    item.message,
                    currentActorRef,
                  );
                  const canModerateMessage = Boolean(
                    user && canManageMessagesToRoom && !ownMessage,
                  );
                  const canEditOrDelete = ownMessage || canModerateMessage;
                  return (
                    <MessageBubble
                      key={`${item.message.id}-${item.message.createdAt}`}
                      message={item.message}
                      isOwn={ownMessage}
                      showAvatar={!grouped}
                      showHeader={!grouped}
                      grouped={grouped}
                      canModerate={canModerateMessage}
                      canViewReaders={ownMessage && !item.message.isDeleted}
                      isRead={ownMessage && item.message.id <= maxReadMessageId}
                      highlighted={item.message.id === highlightedMessageId}
                      onlineUsernames={onlineUsernames}
                      onReply={user ? handleReply : undefined}
                      onEdit={canEditOrDelete ? handleEdit : undefined}
                      onDelete={canEditOrDelete ? handleDelete : undefined}
                      onReact={user ? handleReact : undefined}
                      onViewReaders={user ? handleOpenReaders : undefined}
                      onReplyQuoteClick={handleReplyQuoteClick}
                      onAvatarClick={openUserProfile}
                      onOpenMediaAttachment={handleOpenMediaAttachment}
                    />
                  );
                })()
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
              {newMsgCount > 0 && (
                <span className={styles.scrollFabBadge}>{newMsgCount}</span>
              )}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                <p className={styles.muted}>
                  Чтобы писать в публичном чате, войдите или зарегистрируйтесь.
                </p>
              </div>
            </div>
          )}

          {user && isBlocked && isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Вы заблокировали этого пользователя.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  const peerId = details?.peer?.userId;
                  if (!peerId) {
                    return;
                  }

                  void friendsController
                    .unblockUser(peerId)
                    .then(() => window.location.reload())
                    .catch(() => {});
                }}
              >
                Разблокировать
              </Button>
            </div>
          )}

          {user && isBlocked && !isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Вы не можете писать этому пользователю.
                </p>
              </div>
            </div>
          )}

          {user && showGroupJoinCta && (
            <div
              className={styles.authCallout}
              data-testid="group-join-callout"
            >
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Чтобы отправлять сообщения, сначала присоединитесь к группе.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  void handleJoinGroup();
                }}
                disabled={joinInProgress || permissionsLoading}
              >
                {joinInProgress ? "Присоединяемся..." : "Присоединиться"}
              </Button>
            </div>
          )}

          {user && showGroupReadOnlyNotice && (
            <div
              className={styles.authCallout}
              data-testid="group-readonly-callout"
            >
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  {isBannedInRoom
                    ? "Вы заблокированы в этой группе."
                    : "У вас нет прав на отправку сообщений в этой группе."}
                </p>
              </div>
            </div>
          )}

          {canSendMessages && (
            <MessageInput
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => {
                void sendMessage();
              }}
              onTyping={sendTyping}
              disabled={status !== "online" || !isOnline}
              rateLimitActive={rateLimitActive}
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

      {lightboxAttachmentId !== null &&
        lightboxOpenIndex >= 0 &&
        lightboxMediaItems.length > 0 && (
          <ImageLightbox
            mediaItems={lightboxMediaItems}
            initialIndex={lightboxOpenIndex}
            onClose={() => setLightboxAttachmentId(null)}
          />
        )}

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удалить сообщение?"
      >
        <p
          style={{
            color: "var(--tg-text-secondary, #aaa)",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Это действие нельзя отменить.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={confirmDelete}>
            Удалить
          </Button>
        </div>
      </Modal>
      {readersMenu && (
        <ReadersMenu
          x={readersMenu.x}
          y={readersMenu.y}
          loading={readersMenu.loading}
          error={readersMenu.error}
          entries={readersMenuEntries}
          emptyLabel={
            readersMenu.result?.roomKind === "direct"
              ? "Еще не прочитано"
              : "Еще никто не прочитал"
          }
          onClose={closeReadersMenu}
          onOpenProfile={openUserProfile}
        />
      )}
    </div>
  );
}
