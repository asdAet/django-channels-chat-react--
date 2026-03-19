import type { ReactNode } from "react";

import styles from "../../styles/ui/Panel.module.css";

/**
 * Описывает входные props компонента `Panel`.
 */
type PanelProps = {
  muted?: boolean;
  busy?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Компонент Panel рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function Panel({
  muted = false,
  busy = false,
  className,
  children,
}: PanelProps) {
  return (
    <div
      className={[styles.panel, muted ? styles.muted : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-busy={busy}
    >
      {children}
    </div>
  );
}
