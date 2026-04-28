import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "../../styles/notifications/NotificationViewport.module.css";
import { NotificationContext } from "./NotificationContext";
import type {
  NotificationInput,
  NotificationRecord,
  NotificationsApi,
  NotificationShortcutInput,
  NotificationVariant,
} from "./NotificationTypes";

type NotificationProviderProps = {
  children: ReactNode;
};

const MAX_VISIBLE_NOTIFICATIONS = 4;
const EXIT_ANIMATION_MS = 240;
const DEFAULT_NOTIFICATION_DURATION_MS = 5000;
const DEFAULT_ERROR_DURATION_MS = 7000;

let nextNotificationId = 0;

const getDefaultDuration = (variant: NotificationVariant): number =>
  variant === "error"
    ? DEFAULT_ERROR_DURATION_MS
    : DEFAULT_NOTIFICATION_DURATION_MS;

const normalizeShortcutInput = (
  variant: NotificationVariant,
  input: NotificationShortcutInput,
): NotificationInput =>
  typeof input === "string" ? { variant, message: input } : { ...input, variant };

const variantLabelMap: Record<NotificationVariant, string> = {
  success: "Готово",
  error: "Ошибка",
  warning: "Внимание",
  info: "Информация",
};

const variantClassNameMap: Record<NotificationVariant, string> = {
  success: styles.success,
  error: styles.error,
  warning: styles.warning,
  info: styles.info,
};

function NotificationIcon({ variant }: { variant: NotificationVariant }) {
  if (variant === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (variant === "error") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: NotificationRecord;
  onDismiss: (id: string) => void;
}) {
  const { id, durationMs, status, variant } = notification;

  useEffect(() => {
    if (status !== "open" || durationMs <= 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => onDismiss(id), durationMs);
    return () => window.clearTimeout(timerId);
  }, [durationMs, id, onDismiss, status]);

  const title = notification.title ?? variantLabelMap[variant];
  const role = variant === "error" ? "alert" : "status";

  return (
    <article
      className={[
        styles.card,
        variantClassNameMap[variant],
        status === "exiting" ? styles.cardExiting : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-notification-id={id}
      data-variant={variant}
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
    >
      <span className={styles.icon}>
        <NotificationIcon variant={variant} />
      </span>
      <span className={styles.body}>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.message}>{notification.message}</span>
      </span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(id)}
        aria-label="Закрыть уведомление"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </article>
  );
}

export function NotificationViewport({
  notifications,
  onDismiss,
}: {
  notifications: NotificationRecord[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.viewport}
      aria-label="Уведомления"
      data-testid="notification-viewport"
    >
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </section>
  );
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const removeTimersRef = useRef<Map<string, number>>(new Map());

  const removeNotification = useCallback((id: string) => {
    const timerId = removeTimersRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      removeTimersRef.current.delete(id);
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id && notification.status === "open"
            ? { ...notification, status: "exiting" }
            : notification,
        ),
      );

      if (removeTimersRef.current.has(id)) {
        return;
      }

      const timerId = window.setTimeout(
        () => removeNotification(id),
        EXIT_ANIMATION_MS,
      );
      removeTimersRef.current.set(id, timerId);
    },
    [removeNotification],
  );

  const clear = useCallback(() => {
    removeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    removeTimersRef.current.clear();
    setNotifications([]);
  }, []);

  const notify = useCallback((input: NotificationInput): string => {
    const id = `notification-${Date.now()}-${++nextNotificationId}`;
    const durationMs = input.durationMs ?? getDefaultDuration(input.variant);

    setNotifications((current) => [
      ...current,
      {
        ...input,
        id,
        durationMs,
        status: "open",
      },
    ]);

    return id;
  }, []);

  const success = useCallback(
    (input: NotificationShortcutInput) =>
      notify(normalizeShortcutInput("success", input)),
    [notify],
  );
  const error = useCallback(
    (input: NotificationShortcutInput) =>
      notify(normalizeShortcutInput("error", input)),
    [notify],
  );
  const warning = useCallback(
    (input: NotificationShortcutInput) =>
      notify(normalizeShortcutInput("warning", input)),
    [notify],
  );
  const info = useCallback(
    (input: NotificationShortcutInput) =>
      notify(normalizeShortcutInput("info", input)),
    [notify],
  );

  useEffect(
    () => () => {
      removeTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      removeTimersRef.current.clear();
    },
    [],
  );

  const api = useMemo<NotificationsApi>(
    () => ({
      notify,
      success,
      error,
      warning,
      info,
      dismiss,
      clear,
    }),
    [clear, dismiss, error, info, notify, success, warning],
  );

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS);

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <NotificationViewport
        notifications={visibleNotifications}
        onDismiss={dismiss}
      />
    </NotificationContext.Provider>
  );
}
