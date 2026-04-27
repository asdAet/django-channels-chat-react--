import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import styles from "../../styles/ui/ContextMenu.module.css";

/**
 * Описывает структуру данных `ContextMenuItem`.
 */
export type ContextMenuItem = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
};

/**
 * React-компонент ContextMenu отвечает за отрисовку и обработку UI-сценария.
 */
export function ContextMenu({ items, x, y, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (x + rect.width > window.innerWidth - 8)
      nx = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8)
      ny = window.innerHeight - rect.height - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
  }, [x, y]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    /**
     * Обрабатывает handle resize.
     */
    const handleResize = () => reposition();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [reposition]);

  useEffect(() => {
    /**
     * Обрабатывает handle pointer down.
     * @param event Событие браузера.
     */
    const handlePointerDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        onClose();
        return;
      }
      if (ref.current?.contains(target)) return;
      onClose();
    };
    /**
     * Обрабатывает handle key.
     * @param e DOM-событие, вызвавшее обработчик.
     */
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return;
      item.onClick();
      onClose();
    },
    [onClose],
  );

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={[
            styles.item,
            item.danger ? styles.danger : "",
            item.disabled ? styles.disabled : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          role="menuitem"
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
