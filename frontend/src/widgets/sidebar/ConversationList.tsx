import { useCallback } from "react";
import { useLocation } from "react-router-dom";

import {
  type FilterTab,
  useConversationList,
} from "../../shared/conversationList/ConversationListProvider";
import {
  buildChatTargetPath,
  buildPublicChatPath,
} from "../../shared/lib/chatTarget";
import {
  buildDirectPath,
  buildUserProfilePath,
  formatPublicRef,
} from "../../shared/lib/publicRef";
import {
  resolveIdentityHandle,
  resolveIdentityLabel,
} from "../../shared/lib/userIdentity";
import { Avatar, EmptyState, Skeleton } from "../../shared/ui";
import styles from "../../styles/sidebar/ConversationList.module.css";
import { ConversationListItem } from "./ConversationListItem";

type Props = {
  onNavigate: (path: string) => void;
};

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "personal", label: "Личные" },
  { key: "groups", label: "Группы" },
];

/**
 * Skeleton строк диалогов в сайдбаре. Табы и поиск остаются на месте, чтобы
 * навигация не прыгала во время обновления conversation list.
 */
function ConversationListSkeleton() {
  return (
    <div className={styles.listSkeleton} aria-busy="true">
      {Array.from({ length: 7 }, (_, index) => (
        <div className={styles.listSkeletonRow} key={index}>
          <Skeleton variant="circle" width={45} height={45} />
          <div className={styles.listSkeletonMeta}>
            <Skeleton variant="text" width={index % 2 === 0 ? "52%" : "38%"} />
            <Skeleton variant="text" width={index % 3 === 0 ? "72%" : "58%"} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton результатов глобального поиска, сохраняя раздел списка на месте.
 */
function GlobalSearchSkeleton() {
  return (
    <div className={styles.globalSkeleton} aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.listSkeletonRow} key={index}>
          <Skeleton variant="circle" width={45} height={45} />
          <div className={styles.listSkeletonMeta}>
            <Skeleton variant="text" width="46%" />
            <Skeleton variant="text" width="68%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Отрисовывает список диалогов и результаты глобального поиска в боковой панели.
 *
 * В обычном режиме показывает conversation list по выбранному фильтру,
 * а при активном поиске переключается на секции пользователей, групп и сообщений.
 */
export function ConversationList({ onNavigate }: Props) {
  const {
    items,
    loading,
    filter,
    setFilter,
    searchQuery,
    globalResults,
    globalLoading,
    isGlobalMode,
  } = useConversationList();
  const location = useLocation();

  const getItemPath = useCallback(
    (item: {
      type: string;
      roomTarget: string;
      name: string;
      directRef?: string;
    }) => {
      if (item.type === "direct") {
        return buildDirectPath(item.directRef ?? item.name);
      }
      if (item.type === "room") {
        return buildPublicChatPath();
      }
      return buildChatTargetPath(item.roomTarget);
    },
    [],
  );

  const getSearchMessagePath = useCallback(
    (message: {
      roomKind?: string | null;
      roomTarget?: string | null;
      id: number;
    }) => {
      const roomPath = message.roomTarget
        ? buildChatTargetPath(message.roomTarget)
        : message.roomKind === "public"
          ? buildPublicChatPath()
          : "/friends";
      return `${roomPath}?message=${message.id}`;
    },
    [],
  );

  const isItemActive = useCallback(
    (item: {
      type: string;
      roomTarget: string;
      name: string;
      directRef?: string;
    }) => {
      const path = getItemPath(item);
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    },
    [location.pathname, getItemPath],
  );

  const hasGlobalResults =
    globalResults.users.length > 0 ||
    globalResults.groups.length > 0 ||
    globalResults.messages.length > 0;

  return (
    <>
      <div className={styles.tabs}>
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={[styles.tab, filter === key ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isGlobalMode ? (
        <div className={styles.globalSearchWrap}>
          {globalLoading && <GlobalSearchSkeleton />}

          {!globalLoading && !hasGlobalResults && (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте другой запрос или уточните имя."
            />
          )}

          {!globalLoading && globalResults.users.length > 0 && (
            <section className={styles.globalSection}>
              <h4 className={styles.globalTitle}>Пользователи</h4>
              {globalResults.users.map((user) => {
                const displayName = resolveIdentityLabel(user);
                const handle =
                  resolveIdentityHandle(user) ?? formatPublicRef(user.publicRef);
                return (
                  <button
                    key={`u-${user.publicRef}`}
                    type="button"
                    className={styles.globalItem}
                    onClick={() => onNavigate(buildUserProfilePath(user.publicRef))}
                  >
                    <Avatar
                      username={displayName}
                      profileImage={user.profileImage}
                      avatarCrop={user.avatarCrop}
                      size="tiny"
                    />
                    <div className={styles.globalMeta}>
                      <span className={styles.globalPrimary}>{displayName}</span>
                      <span className={styles.globalSecondary}>{handle}</span>
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {!globalLoading && globalResults.groups.length > 0 && (
            <section className={styles.globalSection}>
              <h4 className={styles.globalTitle}>Группы</h4>
              {globalResults.groups.map((group) => (
                <button
                  key={`g-${group.roomId}`}
                  type="button"
                  className={styles.globalItem}
                  onClick={() => onNavigate(buildChatTargetPath(group.roomTarget))}
                >
                  <Avatar username={group.name} size="tiny" />
                  <div className={styles.globalMeta}>
                    <span className={styles.globalPrimary}>{group.name}</span>
                    {group.publicRef && (
                      <span className={styles.globalSecondary}>
                        {formatPublicRef(group.publicRef)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </section>
          )}

          {!globalLoading && globalResults.messages.length > 0 && (
            <section className={styles.globalSection}>
              <h4 className={styles.globalTitle}>Сообщения</h4>
              {globalResults.messages.map((message) => {
                const displayName = resolveIdentityLabel(message);
                return (
                  <button
                    key={`m-${message.id}`}
                    type="button"
                    className={styles.globalItem}
                    onClick={() => onNavigate(getSearchMessagePath(message))}
                  >
                    <div className={styles.globalMeta}>
                      <span className={styles.globalPrimary}>
                        {displayName} • {message.roomName || String(message.roomId)}
                      </span>
                      <span className={styles.globalSecondary}>
                        {message.content}
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          )}
        </div>
      ) : loading ? (
        <ConversationListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title={searchQuery ? "Ничего не найдено" : "Нет чатов"}
          description={
            searchQuery
              ? "Попробуйте другой запрос."
              : "Откройте публичный чат или начните новый диалог."
          }
        />
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <ConversationListItem
              key={`${item.type}-${item.roomId ?? item.roomTarget}`}
              item={item}
              isActive={isItemActive(item)}
              onClick={() => onNavigate(getItemPath(item))}
            />
          ))}
        </div>
      )}
    </>
  );
}
