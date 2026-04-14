import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "../../../styles/ui/LightboxDropdownMenu.module.css";
import type { LightboxActionItem, LightboxControlsLayout } from "./types";

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  layout: LightboxControlsLayout;
  items: LightboxActionItem[];
  onClose: () => void;
};

const MENU_GAP_PX = 10;
const VIEWPORT_PADDING_PX = 12;

/**
 * Показывает выпадающее меню действий lightbox рядом с кнопкой-источником.
 *
 * Компонент сам вычисляет позицию относительно viewport, закрывается по клику
 * снаружи и по `Escape`, а выбор конкретного действия делегирует item-обработчикам.
 */
export function LightboxDropdownMenu({
  anchorRef,
  layout,
  items,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updatePosition = () => {
      const menuElement = rootRef.current;
      if (!menuElement) {
        return;
      }

      const rect = menuElement.getBoundingClientRect();
      const nextStyle: CSSProperties = {
        maxHeight: `${Math.max(window.innerHeight - VIEWPORT_PADDING_PX * 2, 140)}px`,
      };

      if (rect.bottom > window.innerHeight - VIEWPORT_PADDING_PX) {
        nextStyle.top = "auto";
        nextStyle.bottom = `calc(100% + ${MENU_GAP_PX}px)`;
      }

      const overflowRight = rect.right - (window.innerWidth - VIEWPORT_PADDING_PX);
      const overflowLeft = VIEWPORT_PADDING_PX - rect.left;

      if (overflowRight > 0) {
        nextStyle.transform = `translate3d(${-overflowRight}px, 0, 0)`;
      } else if (overflowLeft > 0) {
        nextStyle.transform = `translate3d(${overflowLeft}px, 0, 0)`;
      }

      setPositionStyle(nextStyle);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [items.length, layout]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        onClose();
        return;
      }

      if (rootRef.current?.contains(target)) {
        return;
      }

      if (anchorRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [anchorRef, onClose]);

  return (
    <div
      ref={rootRef}
      className={[
        styles.menu,
        layout === "mobile" ? styles.menuMobile : styles.menuDesktop,
      ].join(" ")}
      role="menu"
      style={positionStyle}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className={[
            styles.menuItem,
            item.active ? styles.menuItemActive : "",
            item.tone === "danger" ? styles.menuItemDanger : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={item.disabled}
          data-testid={item.testId}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          <span className={styles.menuItemIcon}>{item.icon}</span>
          <span className={styles.menuItemText}>
            <span className={styles.menuItemLabel}>{item.label}</span>
            {item.description ? (
              <span className={styles.menuItemDescription}>
                {item.description}
              </span>
            ) : null}
          </span>
          {index === items.length - 1 ? null : (
            <span className={styles.menuItemDivider} aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}
