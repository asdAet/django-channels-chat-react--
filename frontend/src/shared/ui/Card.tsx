import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import styles from "../../styles/ui/Card.module.css";

/**
 * Определяет структуру данных CardProps.
 */
type CardProps<T extends ElementType = "section"> = {
  as?: T;
  wide?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * Компонент Card рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function Card<T extends ElementType = "section">({
  as,
  wide = false,
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Component = as ?? "section";
  return (
    <Component
      {...rest}
      className={[styles.card, wide ? styles.wide : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Component>
  );
}
