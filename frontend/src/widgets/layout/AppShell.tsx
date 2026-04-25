import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { UserProfile } from "../../entities/user/types";
import { ConversationListProvider } from "../../shared/conversationList/ConversationListProvider";
import {
  InfoPanelProvider,
  useInfoPanel,
} from "../../shared/layout/useInfoPanel";
import {
  MobileShellProvider,
  useMobileShell,
} from "../../shared/layout/useMobileShell";
import { isPrefixlessChatPath } from "../../shared/lib/chatTarget";
import { Toast } from "../../shared/ui";
import styles from "../../styles/layout/AppShell.module.css";
import { InfoPanel } from "./InfoPanel";
import { Sidebar } from "./Sidebar";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  banner: string | null;
  error: string | null;
  isAuthRoute: boolean;
  children: ReactNode;
};

const resolveMobileTitle = (pathname: string): string => {
  if (pathname === "/") return "Главная";
  if (pathname.startsWith("/friends")) return "Друзья";
  if (pathname.startsWith("/groups")) return "Группы";
  if (pathname === "/profile" || pathname.startsWith("/users/")) {
    return "Профиль";
  }
  if (pathname.startsWith("/settings")) return "Настройки";
  if (pathname.startsWith("/invite/")) return "Приглашение";
  if (pathname === "/public") return "Публичный чат";
  if (isPrefixlessChatPath(pathname)) return "Чат";
  return "Devil";
};

/**
 * Компонент ShellLayout рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
function ShellLayout({
  user,
  onNavigate,
  onLogout,
  banner,
  error,
  isAuthRoute,
  children,
}: Props) {
  const { isOpen } = useInfoPanel();
  const { closeDrawer, isDrawerOpen, isMobileViewport, openDrawer } =
    useMobileShell();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatRoute = isPrefixlessChatPath(location.pathname);
  const showMobilePageHeader = !isChatRoute;
  const mobileTitle = resolveMobileTitle(location.pathname);

  useEffect(() => {
    closeDrawer();
  }, [closeDrawer, location.pathname]);

  const handleNavigate = useCallback(
    (path: string) => {
      closeDrawer();
      onNavigate(path);
    },
    [closeDrawer, onNavigate],
  );

  const handleMobileBack = useCallback(() => {
    if (
      location.pathname === "/" ||
      location.pathname.startsWith("/friends") ||
      location.pathname.startsWith("/groups")
    ) {
      // Mobile top-level sections use the header button as a drawer opener.
      openDrawer();
      return;
    }

    closeDrawer();
    if (window.history.length > 1 && location.pathname !== "/") {
      navigate(-1);
      return;
    }
    onNavigate("/");
  }, [closeDrawer, location.pathname, navigate, onNavigate, openDrawer]);

  return (
    <div
      className={[
        styles.shell,
        isOpen ? styles.withInfoPanel : "",
        showMobilePageHeader ? styles.mobilePageHeaderVisible : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
          type="button"
          className={[
            styles.sidebarBackdrop,
            isDrawerOpen ? styles.sidebarBackdropOpen : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={closeDrawer}
          aria-label="Закрыть меню"
          data-testid="app-shell-sidebar-backdrop"
      />

      <div
        className={[
          styles.sidebarPane,
          isDrawerOpen ? styles.sidebarPaneMobileOpen : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={isMobileViewport && !isDrawerOpen}
        data-testid="app-shell-sidebar-pane"
        data-mobile-drawer-open={
          isMobileViewport && isDrawerOpen ? "true" : "false"
        }
      >
        <Sidebar
          user={user}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          onCloseMobileDrawer={closeDrawer}
        />
      </div>
      <div className={styles.main}>
        {showMobilePageHeader && (
          <header className={styles.mobilePageHeader}>
            <button
              type="button"
              className={styles.mobilePageAction}
              onClick={handleMobileBack}
              aria-label="Назад"
              data-testid="app-shell-mobile-back"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <strong className={styles.mobilePageTitle}>{mobileTitle}</strong>
          </header>
        )}
        {(banner || (error && !isAuthRoute)) && (
          <div className={styles.banners}>
            {banner && (
              <Toast variant="success" role="status">
                {banner}
              </Toast>
            )}
            {error && !isAuthRoute && (
              <Toast variant="danger" role="alert">
                {error}
              </Toast>
            )}
          </div>
        )}
        <div
          className={[styles.mainInner, isChatRoute ? styles.mainInnerChat : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
      <InfoPanel currentPublicRef={user?.publicRef ?? null} />
    </div>
  );
}

/**
 * React-компонент AppShell отвечает за отрисовку и обработку UI-сценария.
 * @param props Свойства компонента или хука.
 */
export function AppShell(props: Props) {
  return (
    <ConversationListProvider user={props.user} ready={true}>
      <InfoPanelProvider>
        <MobileShellProvider>
          <ShellLayout {...props} />
        </MobileShellProvider>
      </InfoPanelProvider>
    </ConversationListProvider>
  );
}
