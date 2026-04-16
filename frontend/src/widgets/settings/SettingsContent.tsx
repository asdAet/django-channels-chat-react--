import { useCallback, useState } from "react";

import type { UserProfile } from "../../entities/user/types";
import { formatFullName } from "../../shared/lib/format";
import { formatPublicRef } from "../../shared/lib/publicRef";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { EmptyState } from "../../shared/ui";
import styles from "../../styles/pages/SettingsPage.module.css";

/**
 * Свойства содержимого страницы настроек пользователя.
 *
 * @property user Профиль текущего пользователя. Если `null`, вместо формы
 *   будет показан призыв авторизоваться.
 * @property onNavigate Колбэк для перехода к смежным разделам, например к профилю.
 * @property onLogout Колбэк выхода из аккаунта.
 * @property compact Включает компактный режим для встраивания в боковую панель.
 * @property showTitle Управляет отображением заголовка раздела.
 */
type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void> | void;
  compact?: boolean;
  showTitle?: boolean;
};

/**
 * Показывает основной контент страницы настроек аккаунта.
 *
 * Компонент объединяет блок профиля, переключатель browser push-уведомлений,
 * памятку по горячим клавишам и действие выхода из аккаунта. В компактном
 * режиме используется как встраиваемая панель без лишнего визуального шума.
 */
export function SettingsContent({
  user,
  onNavigate,
  onLogout,
  compact = false,
  showTitle = true,
}: Props) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
  );

  const handleToggleNotifications = useCallback(async () => {
    // На unsupported браузерах ничего не делаем, чтобы не ломать настройки.
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      setNotificationsEnabled(false);
      return;
    }

    const result = await Notification.requestPermission();
    setNotificationsEnabled(result === "granted");
  }, []);

  if (!user) {
    return (
      <EmptyState
        title="Авторизуйтесь"
        description="Для доступа к настройкам войдите в аккаунт."
      />
    );
  }

  const fullName =
    formatFullName(
      user.name,
      (user as { last_name?: string | null }).last_name,
    ) || resolveIdentityLabel(user, "Без имени");
  const publicRef = (user.publicRef || "").trim();

  return (
    <div
      className={[styles.root, compact ? styles.embeddedRoot : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {showTitle && (
        <h1
          className={[styles.title, compact ? styles.embeddedTitle : ""]
            .filter(Boolean)
            .join(" ")}
        >
          Настройки
        </h1>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Аккаунт</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>{fullName}</div>
            #TODO: Сделать Отображение @username, если publicRef не пустой
            {/* {publicRef && (<div className={styles.rowDesc}>{formatPublicRef(publicRef)}</div>)} */}
            <div className={styles.rowDesc}>{user.email}</div>
          </div>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={() => onNavigate("/profile")}
            style={{ flex: "none", padding: "6px 16px" }}
          >
            Редактировать
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Уведомления</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Push-уведомления</div>
            <div className={styles.rowDesc}>
              Получать уведомления о новых сообщениях
            </div>
          </div>
          <button
            type="button"
            className={[
              styles.toggle,
              notificationsEnabled ? styles.toggleActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={handleToggleNotifications}
            aria-label="Переключить уведомления"
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Горячие клавиши</div>
        <div className={styles.shortcutsList}>
          <div className={styles.shortcutRow}>
            <span>Поиск</span>
            <span className={styles.shortcutKey}>Ctrl+K</span>
          </div>
          <div className={styles.shortcutRow}>
            <span>Закрыть панель</span>
            <span className={styles.shortcutKey}>Esc</span>
          </div>
          <div className={styles.shortcutRow}>
            <span>Отправить сообщение</span>
            <span className={styles.shortcutKey}>Enter</span>
          </div>
          <div className={styles.shortcutRow}>
            <span>Новая строка</span>
            <span className={styles.shortcutKey}>Shift+Enter</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Опасная зона</div>
        <button type="button" className={styles.dangerBtn} onClick={onLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
