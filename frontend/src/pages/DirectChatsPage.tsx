import { useEffect, useMemo } from "react";

import type { UserProfile } from "../entities/user/types";
import { buildDirectPath, normalizePublicRef } from "../shared/lib/publicRef";
import { formatTimestamp } from "../shared/lib/format";
import { useDirectInbox } from "../shared/directInbox";
import { usePresence } from "../shared/presence";
import { Avatar, Button, Card, Panel, Toast } from "../shared/ui";
import styles from "../styles/pages/DirectChatsPage.module.css";

type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
};

type ListProps = Props & {
  activeUsername?: string;
  resetActiveOnMount?: boolean;
  className?: string;
};

const normalizeActorRef = (value: string): string =>
  normalizePublicRef(value).toLowerCase();

export function DirectChatsList({
  user,
  onNavigate,
  activeUsername,
  resetActiveOnMount = true,
  className,
}: ListProps) {
  const { items, loading, error, setActiveRoom, refresh, unreadCounts } =
    useDirectInbox();
  const { online: presenceOnline, status: presenceStatus } = usePresence();
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

  useEffect(() => {
    if (!resetActiveOnMount) return;
    setActiveRoom(null);
  }, [resetActiveOnMount, setActiveRoom]);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [refresh, user]);

  if (!user) {
    return (
      <Panel>
        <p>Чтобы пользоваться личными чатами, войдите в аккаунт.</p>
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
    <Card
      as="section"
      aria-label="Список личных чатов"
      className={[styles.directInbox, className].filter(Boolean).join(" ")}
    >
      {loading && <p className={styles.muted}>Загрузка диалогов...</p>}
      {error && <Toast variant="danger">{error}</Toast>}

      {!loading && !error && !items.length && (
        <p className={styles.muted}>Пока нет личных сообщений</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.directChatList}>
          {items.map((item) => {
            const peerRef = item.peer.publicRef;
            const isActive = Boolean(
              activeUsername &&
                normalizePublicRef(peerRef) === normalizePublicRef(activeUsername),
            );
            const isPeerOnline = onlineUsernames.has(
              normalizeActorRef(peerRef),
            );
            return (
              <button
                key={item.slug}
                className={[
                  styles.directChatItem,
                  isActive ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(buildDirectPath(peerRef))}
                type="button"
              >
                <Avatar
                  username={item.peer.displayName ?? item.peer.username}
                  profileImage={item.peer.profileImage}
                  avatarCrop={item.peer.avatarCrop}
                  size="tiny"
                  online={isPeerOnline}
                />
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <strong
                      className={styles.itemName}
                      title={item.peer.displayName ?? item.peer.username}
                    >
                      {item.peer.displayName ?? item.peer.username}
                    </strong>
                    <div className={styles.itemMeta}>
                      <span className={styles.time}>
                        {formatTimestamp(item.lastMessageAt)}
                      </span>
                      {unreadCounts[item.slug] > 0 && (
                        <span className={styles.badge}>
                          {unreadCounts[item.slug]}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={styles.preview}>{item.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function DirectChatsPage({ user, onNavigate }: Props) {
  return <DirectChatsList user={user} onNavigate={onNavigate} />;
}

