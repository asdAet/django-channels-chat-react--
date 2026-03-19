import { type ReactNode,useCallback, useEffect, useState } from "react";

import styles from "../../styles/ui/Toast.module.css";

/**
 * Описывает структуру данных `ToastVariant`.
 */
type ToastVariant = "success" | "danger" | "warning";

/**
 * Описывает входные props компонента `Toast`.
 */
type ToastProps = {
  variant: ToastVariant;
  role?: "status" | "alert";
  className?: string;
  autoDismissMs?: number;
  onDismiss?: () => void;
  children: ReactNode;
};

const variantClassMap: Record<ToastVariant, string> = {
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
};

/**
 * Компонент Toast рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function Toast({
  variant,
  role = "status",
  className,
  autoDismissMs = 5000,
  onDismiss,
  children,
}: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 250);
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const timer = window.setTimeout(dismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={[
        styles.toast,
        variantClassMap[variant],
        exiting ? styles.exiting : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={role}
      onClick={dismiss}
    >
      {children}
    </div>
  );
}
