import { type MouseEvent, useRef } from "react";

import styles from "../../../styles/ui/LightboxChrome.module.css";
import { LightboxDropdownMenu } from "./LightboxDropdownMenu";
import { LightboxIconButton } from "./LightboxIconButton";
import { CloseIcon, MoreIcon } from "./LightboxIcons";
import type {
  LightboxActionItem,
  LightboxControlsLayout,
  LightboxDropdownMenuController,
} from "./types";

type Props = {
  layout: LightboxControlsLayout;
  title: string;
  subtitle?: string;
  counterLabel?: string;
  directActions?: LightboxActionItem[];
  menuActions?: LightboxActionItem[];
  menuController: LightboxDropdownMenuController;
  onClose: () => void;
};

/**
 * Отрисовывает верхнюю chrome-панель lightbox с заголовком и action-кнопками.
 *
 * Компонент объединяет прямые действия, выпадающее меню и кнопку закрытия,
 * сохраняя единый вид для desktop- и mobile-режимов.
 */
export function LightboxChrome({
  layout,
  title,
  subtitle,
  counterLabel,
  directActions = [],
  menuActions = [],
  menuController,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const hasMenu = menuActions.length > 0;
  const isMenuOpen = menuController.activeMenuId === "more";

  const stopPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className={[
        styles.chrome,
        layout === "mobile" ? styles.chromeMobile : styles.chromeDesktop,
      ].join(" ")}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      onPointerDown={stopPropagation}
    >
      <div className={styles.chromeTitleBlock}>
        <div className={styles.chromeTitleRow}>
          <div className={styles.chromeTitle}>{title}</div>
          {counterLabel ? (
            <div className={styles.chromeCounter}>{counterLabel}</div>
          ) : null}
        </div>
        {subtitle ? (
          <div className={styles.chromeSubtitle}>{subtitle}</div>
        ) : null}
      </div>

      <div className={styles.chromeActions}>
        {directActions.map((action) => (
          <LightboxIconButton
            key={action.key}
            layout={layout}
            label={action.label}
            icon={action.icon}
            active={action.active}
            tone={action.tone}
            disabled={action.disabled}
            data-testid={action.testId}
            onClick={() => {
              action.onSelect();
            }}
          />
        ))}

        {hasMenu ? (
          <div ref={menuWrapRef} className={styles.menuWrap}>
            <LightboxIconButton
              layout={layout}
              label="Дополнительно"
              icon={<MoreIcon layout={layout} />}
              active={isMenuOpen}
              onClick={() => {
                menuController.onToggleMenu("more");
              }}
              data-testid="lightbox-more-button"
            />
            {isMenuOpen ? (
              <LightboxDropdownMenu
                anchorRef={menuWrapRef}
                layout={layout}
                items={menuActions}
                onClose={menuController.onCloseMenu}
              />
            ) : null}
          </div>
        ) : null}

        <LightboxIconButton
          layout={layout}
          label="Закрыть"
          icon={<CloseIcon layout={layout} />}
          onClick={onClose}
        />
      </div>
    </div>
  );
}
