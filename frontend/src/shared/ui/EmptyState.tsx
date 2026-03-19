import type { ReactNode } from "react";

import styles from "../../styles/ui/EmptyState.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  icon?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Компонент EmptyState рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <p className={styles.title}>{title}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  );
}
