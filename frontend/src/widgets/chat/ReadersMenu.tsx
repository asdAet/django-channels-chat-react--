import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import type { AvatarCrop } from "../../shared/api/users";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/chat/ReadersMenu.module.css";

export type ReadersMenuEntry = {
  key: string;
  publicRef: string | null;
  username?: string | null;
  displayName?: string | null;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
  readAt: string | null;
};

type Props = {
  x: number;
  y: number;
  loading: boolean;
  error: string | null;
  entries: ReadersMenuEntry[];
  emptyLabel: string;
  onClose: () => void;
  onOpenProfile?: (publicRef: string) => void;
};

const formatExactReadAt = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));

/**
 * Показывает контекстное меню с пользователями, прочитавшими сообщение.
 *
 * Меню привязывается к координатам клика, само удерживает себя внутри viewport
 * и умеет открывать профиль читателя, если для него доступен public ref.
 */
export function ReadersMenu({
  x,
  y,
  loading,
  error,
  entries,
  emptyLabel,
  onClose,
  onOpenProfile,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    let nextX = x;
    let nextY = y;

    // Keep the anchored menu inside the viewport when it opens near an edge.
    if (x + rect.width > window.innerWidth - 8) {
      nextX = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight - 8) {
      nextY = window.innerHeight - rect.height - 8;
    }
    if (nextX < 8) nextX = 8;
    if (nextY < 8) nextY = 8;

    element.style.left = `${nextX}px`;
    element.style.top = `${nextY}px`;
  }, [x, y]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    const handleResize = () => reposition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [reposition]);

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        onClose();
        return;
      }
      if (ref.current?.contains(target)) return;
      onClose();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const supportsPointer =
      typeof window !== "undefined" && "PointerEvent" in window;
    if (supportsPointer) {
      document.addEventListener("pointerdown", handlePointerDown);
    } else {
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("mousedown", handlePointerDown);
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      if (supportsPointer) {
        document.removeEventListener("pointerdown", handlePointerDown);
      } else {
        document.removeEventListener("touchstart", handlePointerDown);
        document.removeEventListener("mousedown", handlePointerDown);
      }
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleRowClick = useCallback(
    (
      event: ReactMouseEvent<HTMLButtonElement>,
      publicRef: string | null,
    ) => {
      event.stopPropagation();
      if (!publicRef || !onOpenProfile) return;
      onOpenProfile(publicRef);
      onClose();
    },
    [onClose, onOpenProfile],
  );

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      role="menu"
      aria-label="Кто прочитал"
    >
      {loading && <div className={styles.state}>Загружаем прочтения...</div>}

      {!loading && error && <div className={styles.state}>{error}</div>}

      {!loading && !error && entries.length < 1 && (
        <div className={styles.state}>{emptyLabel}</div>
      )}

      {!loading &&
        !error &&
        entries.map((entry) => {
          const displayName = resolveIdentityLabel(entry);
          const isClickable = Boolean(entry.publicRef && onOpenProfile);

          return (
            <button
              key={entry.key}
              type="button"
              className={[
                styles.row,
                !isClickable ? styles.rowStatic : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={(event) => handleRowClick(event, entry.publicRef)}
              disabled={!isClickable}
              role="menuitem"
            >
              <Avatar
                username={displayName}
                profileImage={entry.profileImage}
                avatarCrop={entry.avatarCrop ?? undefined}
                size="small"
                loading="eager"
              />
              <div className={styles.meta}>
                <span className={styles.name}>{displayName}</span>
                <span className={styles.time}>
                  {entry.readAt ? formatExactReadAt(entry.readAt) : emptyLabel}
                </span>
              </div>
              {isClickable && (
                <span className={styles.chevron} aria-hidden="true">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
    </div>
  );
}
