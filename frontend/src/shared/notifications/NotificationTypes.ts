import type { ReactNode } from "react";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export type NotificationInput = {
  variant: NotificationVariant;
  title?: string;
  message: ReactNode;
  durationMs?: number;
};

export type NotificationShortcutInput =
  | string
  | (Omit<NotificationInput, "variant"> & { message: ReactNode });

export type NotificationStatus = "open" | "exiting";

export type NotificationRecord = Required<Pick<NotificationInput, "variant">> &
  Omit<NotificationInput, "variant"> & {
    id: string;
    durationMs: number;
    status: NotificationStatus;
  };

export type NotificationsApi = {
  notify: (input: NotificationInput) => string;
  success: (input: NotificationShortcutInput) => string;
  error: (input: NotificationShortcutInput) => string;
  warning: (input: NotificationShortcutInput) => string;
  info: (input: NotificationShortcutInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};
