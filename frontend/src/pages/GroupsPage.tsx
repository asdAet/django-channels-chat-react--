import { useCallback, useState } from "react";

import type { UserProfile } from "../entities/user/types";
import { useGroupList } from "../hooks/useGroupList";
import { buildChatTargetPath } from "../shared/lib/chatTarget";
import { EmptyState, Skeleton } from "../shared/ui";
import styles from "../styles/groups/GroupsPageView.module.css";
import { CreateGroupDialog } from "../widgets/groups/CreateGroupDialog";
import { GroupListItem } from "../widgets/groups/GroupListItem";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
};

/**
 * React-компонент IconPlus отвечает за отрисовку и обработку UI-сценария.
 */
const IconPlus = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Skeleton списка групп. Верхняя панель и поиск остаются интерактивным каркасом,
 * а эта зона имитирует только данные, которые приходят с API.
 */
function GroupsListSkeleton() {
  return (
    <div className={styles.listSkeleton} aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div className={styles.groupSkeletonRow} key={index}>
          <Skeleton variant="circle" width={42} height={42} />
          <div className={styles.groupSkeletonMeta}>
            <Skeleton variant="text" width="42%" height={14} />
            <Skeleton variant="text" width="62%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * React-компонент GroupsPage отвечает за отрисовку и обработку UI-сценария.
 */
export function GroupsPage({ user, onNavigate }: Props) {
  const { groups, loading, error, search, setSearch, reload } = useGroupList();
  const [showCreate, setShowCreate] = useState(false);

  const handleGroupClick = useCallback(
    (roomTarget: string) => onNavigate(buildChatTargetPath(roomTarget)),
    [onNavigate],
  );

  const handleCreated = useCallback(
    (roomTarget: string) => {
      setShowCreate(false);
      reload();
      onNavigate(buildChatTargetPath(roomTarget));
    },
    [reload, onNavigate],
  );

  if (!user) {
    return (
      <div className={styles.root}>
        <EmptyState
          title="Авторизуйтесь"
          description="Для просмотра групп войдите в аккаунт."
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Группы</span>
        <div className={styles.headerSpacer} />
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setShowCreate(true)}
        >
          <IconPlus /> Создать
        </button>
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск групп..."
        />
      </div>

      <div className={styles.body}>
        {loading && <GroupsListSkeleton />}

        {error && <div className={styles.centered}>{error}</div>}

        {!loading && !error && groups.length === 0 && (
          <EmptyState
            title="Нет групп"
            description={
              search ? "Ничего не найдено." : "Создайте первую группу."
            }
          />
        )}

        {!loading &&
          !error &&
          groups.map((g) => (
            <GroupListItem key={g.roomId} group={g} onClick={handleGroupClick} />
          ))}
      </div>

      {showCreate && (
        <CreateGroupDialog
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
