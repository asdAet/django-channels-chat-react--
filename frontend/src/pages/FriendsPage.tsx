import { useCallback, useEffect, useMemo, useState } from "react";

import type { BlockedUser } from "../entities/friend/types";
import type { UserProfile } from "../entities/user/types";
import { useFriends } from "../hooks/useFriends";
import { buildDirectPath, normalizePublicRef } from "../shared/lib/publicRef";
import {
  resolveIdentityHandle,
  resolveIdentityLabel,
} from "../shared/lib/userIdentity";
import { usePresence } from "../shared/presence";
import { Avatar, EmptyState, Spinner } from "../shared/ui";
import styles from "../styles/friends/FriendsPageView.module.css";
import { AddFriendDialog } from "../widgets/friends/AddFriendDialog";
import { FriendListItem } from "../widgets/friends/FriendListItem";
import { FriendRequestItem } from "../widgets/friends/FriendRequestItem";

type Tab = "friends" | "online" | "incoming" | "outgoing" | "blocked";

type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
};

type SearchableItem = {
  publicRef: string;
  username: string;
  displayName?: string;
};

type TabMeta = {
  label: string;
  searchPlaceholder: string;
  totalCount: number;
};

const normalizeActorRef = (value: string): string =>
  normalizePublicRef(value).toLowerCase();

const filterBySearch = <T extends SearchableItem>(
  items: T[],
  query: string,
): T[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const searchIndex = [
      resolveIdentityLabel(item, ""),
      item.username,
      normalizePublicRef(item.publicRef),
    ]
      .join(" ")
      .toLowerCase();
    return searchIndex.includes(normalizedQuery);
  });
};

const IconPlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconFriends = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5Z" />
    <path d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z" />
    <path d="M8 13c-2.67 0-6 1.34-6 4v1h12v-1c0-2.66-3.33-4-6-4Z" />
    <path d="M16 13c-.53 0-1.09.06-1.65.19 1.57.78 2.65 2.03 2.65 3.81v1h5v-1c0-2.66-3.33-4-6-4Z" />
  </svg>
);

const IconSearch = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.65" y2="16.65" />
  </svg>
);

export function FriendsPage({ user, onNavigate }: Props) {
  const {
    friends,
    incoming,
    outgoing,
    blocked,
    infoMessage,
    loading,
    error,
    clearInfoMessage,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelOutgoingRequest,
    removeFriend,
    blockUser,
    unblockUser,
  } = useFriends();

  const { online: presenceOnline, status: presenceStatus } = usePresence();
  const [tab, setTab] = useState<Tab>("friends");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onlineUsernames = useMemo(
    () =>
      new Set(
        presenceStatus === "online"
          ? presenceOnline.map((entry) =>
              normalizeActorRef(entry.publicRef || ""),
            )
          : [],
      ),
    [presenceOnline, presenceStatus],
  );

  const resolveFriendRef = useCallback(
    (friend: { publicRef: string }) => friend.publicRef,
    [],
  );

  const onlineFriends = useMemo(
    () =>
      friends.filter((friend) =>
        onlineUsernames.has(normalizeActorRef(resolveFriendRef(friend))),
      ),
    [friends, onlineUsernames, resolveFriendRef],
  );

  // Keep search filtering local to the friends view; no API changes here.
  const filteredFriends = useMemo(
    () => filterBySearch(friends, searchQuery),
    [friends, searchQuery],
  );
  const filteredOnlineFriends = useMemo(
    () => filterBySearch(onlineFriends, searchQuery),
    [onlineFriends, searchQuery],
  );
  const filteredIncoming = useMemo(
    () => filterBySearch(incoming, searchQuery),
    [incoming, searchQuery],
  );
  const filteredOutgoing = useMemo(
    () => filterBySearch(outgoing, searchQuery),
    [outgoing, searchQuery],
  );
  const filteredBlocked = useMemo(
    () => filterBySearch(blocked, searchQuery),
    [blocked, searchQuery],
  );

  useEffect(() => {
    if (!infoMessage) return;
    const timer = window.setTimeout(() => clearInfoMessage(), 3000);
    return () => window.clearTimeout(timer);
  }, [clearInfoMessage, infoMessage]);

  const handleMessage = useCallback(
    (publicRef: string) => onNavigate(buildDirectPath(publicRef)),
    [onNavigate],
  );

  const tabMeta = useMemo<Record<Tab, TabMeta>>(
    () => ({
      friends: {
        label: "Все",
        searchPlaceholder: "Поиск среди друзей",
        totalCount: friends.length,
      },
      online: {
        label: "Онлайн",
        searchPlaceholder: "Поиск среди друзей онлайн",
        totalCount: onlineFriends.length,
      },
      incoming: {
        label: "Входящие",
        searchPlaceholder: "Поиск по входящим запросам",
        totalCount: incoming.length,
      },
      outgoing: {
        label: "Исходящие",
        searchPlaceholder: "Поиск по исходящим запросам",
        totalCount: outgoing.length,
      },
      blocked: {
        label: "Заблокированные",
        searchPlaceholder: "Поиск по заблокированным",
        totalCount: blocked.length,
      },
    }),
    [blocked.length, friends.length, incoming.length, onlineFriends.length, outgoing.length],
  );

  const activeMeta = tabMeta[tab];

  const renderEmptyState = useCallback(
    (title: string, description: string) => (
      <div className={styles.emptyStateWrap}>
        <EmptyState
          title={title}
          description={description}
          className={styles.emptyStateCard}
        />
      </div>
    ),
    [],
  );

  const renderBlockedUsers = useCallback(
    (items: BlockedUser[]) =>
      items.map((blockedUser) => (
        <div key={blockedUser.id} className={styles.blockedRow}>
          <Avatar
            username={resolveIdentityLabel(blockedUser)}
            profileImage={blockedUser.profileImage ?? null}
            avatarCrop={blockedUser.avatarCrop ?? undefined}
            size="small"
            online={false}
            loading="eager"
          />
          <div className={styles.blockedInfo}>
            <div className={styles.blockedName}>
              {resolveIdentityLabel(blockedUser)}
            </div>
            <div className={styles.blockedMeta}>
              {resolveIdentityHandle(blockedUser) ?? "Без идентификатора"}
            </div>
          </div>
          <button
            type="button"
            className={styles.blockedAction}
            onClick={() => void unblockUser(blockedUser.userId)}
          >
            Разблокировать
          </button>
        </div>
      )),
    [unblockUser],
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.centered}>
          <Spinner size="md" />
        </div>
      );
    }

    if (error) {
      return <div className={styles.centered}>{error}</div>;
    }

    if (tab === "friends") {
      if (filteredFriends.length === 0) {
        return renderEmptyState(
          searchQuery.trim() ? "Ничего не найдено" : "Нет друзей",
          searchQuery.trim()
            ? "Попробуйте другой запрос или очистите поиск."
            : "Добавьте друзей, чтобы начать общение.",
        );
      }

      return filteredFriends.map((friend) => (
        <FriendListItem
          key={friend.id}
          friend={friend}
          isOnline={onlineUsernames.has(normalizeActorRef(resolveFriendRef(friend)))}
          onMessage={handleMessage}
          onRemove={removeFriend}
          onBlock={blockUser}
        />
      ));
    }

    if (tab === "online") {
      if (filteredOnlineFriends.length === 0) {
        return renderEmptyState(
          searchQuery.trim() ? "Ничего не найдено" : "Нет друзей онлайн",
          searchQuery.trim()
            ? "По текущему запросу никто не найден."
            : "Когда кто-то появится в сети, он будет показан здесь.",
        );
      }

      return filteredOnlineFriends.map((friend) => (
        <FriendListItem
          key={friend.id}
          friend={friend}
          isOnline={true}
          onMessage={handleMessage}
          onRemove={removeFriend}
          onBlock={blockUser}
        />
      ));
    }

    if (tab === "incoming") {
      if (filteredIncoming.length === 0) {
        return renderEmptyState(
          searchQuery.trim() ? "Ничего не найдено" : "Нет входящих запросов",
          searchQuery.trim()
            ? "По текущему запросу входящих заявок нет."
            : "Новые запросы в друзья появятся здесь.",
        );
      }

      return filteredIncoming.map((request) => (
        <FriendRequestItem
          key={request.id}
          request={request}
          direction="incoming"
          onAccept={acceptRequest}
          onDecline={declineRequest}
        />
      ));
    }

    if (tab === "outgoing") {
      if (filteredOutgoing.length === 0) {
        return renderEmptyState(
          searchQuery.trim() ? "Ничего не найдено" : "Нет исходящих запросов",
          searchQuery.trim()
            ? "По текущему запросу исходящих заявок нет."
            : "Вы пока никому не отправляли запросы.",
        );
      }

      return filteredOutgoing.map((request) => (
        <FriendRequestItem
          key={request.id}
          request={request}
          direction="outgoing"
          onCancel={cancelOutgoingRequest}
        />
      ));
    }

    if (filteredBlocked.length === 0) {
      return renderEmptyState(
        searchQuery.trim() ? "Ничего не найдено" : "Нет заблокированных",
        searchQuery.trim()
          ? "По текущему запросу совпадений нет."
          : "Пользователи, которых вы заблокировали, появятся здесь.",
      );
    }

    return renderBlockedUsers(filteredBlocked);
  };

  if (!user) {
    return (
      <section className={styles.root}>
        <div className={styles.guestShell}>
          <EmptyState
            title="Авторизуйтесь"
            description="Для просмотра друзей войдите в аккаунт."
            className={styles.emptyStateCard}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLead}>
          <span className={styles.toolbarIcon} aria-hidden="true">
            <IconFriends />
          </span>
          <span className={styles.toolbarTitle}>Друзья</span>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarTabs}>
          {(Object.keys(tabMeta) as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              className={[
                styles.tab,
                tab === tabKey ? styles.tabActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setTab(tabKey)}
            >
              <span>{tabMeta[tabKey].label}</span>
              <span className={styles.tabCount}>{tabMeta[tabKey].totalCount}</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddDialog(true)}
            aria-label="Добавить друга"
          >
            <IconPlus />
            <span className={styles.addBtnLabel}>Добавить друга</span>
          </button>
        </div>
      </header>

      {infoMessage && <div className={styles.infoBanner}>{infoMessage}</div>}

      <div className={styles.contentShell}>
        <div className={styles.listPane}>
          <div className={styles.listControls}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={activeMeta.searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.body}>{renderContent()}</div>
        </div>
      </div>

      {showAddDialog && (
        <AddFriendDialog
          onSubmit={sendRequest}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </section>
  );
}