import styles from "../../styles/ui/Spinner.module.css";

/**
 * Описывает структуру данных `SpinnerSize`.
 */
type SpinnerSize = "sm" | "md" | "lg";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  size?: SpinnerSize;
  className?: string;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * React-компонент Spinner отвечает за отрисовку и обработку UI-сценария.
 */
export function Spinner({ size = "md", className }: Props) {
  return (
    <span
      className={[styles.spinner, sizeClass[size], className]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label="Загрузка"
    />
  );
}
