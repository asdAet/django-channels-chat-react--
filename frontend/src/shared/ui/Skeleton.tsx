import type { CSSProperties } from "react";

import styles from "../../styles/ui/Skeleton.module.css";

type SkeletonVariant = "block" | "circle" | "text";

/**
 * Свойства универсального skeleton-placeholder.
 *
 * Компонент intentionally принимает только размеры и вариант формы: содержимое
 * остается за владельцем экрана, а shared-слой отвечает за единый визуальный
 * язык загрузки.
 */
type SkeletonProps = {
  /**
   * Геометрия placeholder: прямоугольник, круг или строка текста.
   */
  variant?: SkeletonVariant;
  /**
   * CSS-ширина элемента. Используется для имитации реального контента.
   */
  width?: CSSProperties["width"];
  /**
   * CSS-высота элемента. Для текстовых строк обычно задается явно.
   */
  height?: CSSProperties["height"];
  /**
   * Радиус скругления, когда стандартный вариант формы недостаточен.
   */
  radius?: CSSProperties["borderRadius"];
  /**
   * Дополнительный класс для локальной раскладки конкретного экрана.
   */
  className?: string;
  /**
   * Инлайновые CSS-переменные и точечные размеры от вызывающего слоя.
   */
  style?: CSSProperties;
};

const skeletonVariantClassMap: Record<SkeletonVariant, string> = {
  block: styles.block,
  circle: styles.circle,
  text: styles.text,
};

/**
 * Рендерит анимированный placeholder для данных, которые догружаются отдельно
 * от постоянного каркаса интерфейса.
 */
export function Skeleton({
  variant = "block",
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={[
        styles.skeleton,
        skeletonVariantClassMap[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
