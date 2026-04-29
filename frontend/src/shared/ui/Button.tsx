import type { ButtonHTMLAttributes } from "react";

import styles from "../../styles/ui/Button.module.css";

/**
 * Описывает структуру данных `ButtonVariant`.
 */
export type ButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "ghost"
  | "outline"
  | "link"
  | "dangerLink";

/**
 * Описывает входные props компонента `Button`.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClassMap: Record<ButtonVariant, string> = {
  danger: styles.danger,
  primary: styles.primary,
  success: styles.success,
  ghost: styles.ghost,
  outline: styles.outline,
  link: styles.link,
  dangerLink: styles.dangerLink,
};

/**
 * Компонент Button рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        styles.button,
        variantClassMap[variant],
        fullWidth ? styles.fullWidth : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
