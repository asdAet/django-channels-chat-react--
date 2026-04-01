import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import type { UserProfile } from "../../entities/user/types";
import { useConversationList } from "../../shared/conversationList/ConversationListProvider";
import { useDirectInbox } from "../../shared/directInbox";
import {
  buildChatTargetPath,
  buildPublicChatPath,
  normalizeChatTarget,
  parseChatTargetFromPathname,
  PUBLIC_CHAT_TARGET,
} from "../../shared/lib/chatTarget";
import { useDevice } from "../../shared/lib/device";
import {
  DIRECT_HOME_FALLBACK_PATH,
  rememberLastDirectRef,
  resolveRememberedDirectPath,
} from "../../shared/lib/directNavigation";
import { formatFullName } from "../../shared/lib/format";
import {
  buildDirectPath,
  buildUserProfilePath,
  normalizePublicRef,
} from "../../shared/lib/publicRef";
import {
  resolveIdentityHandle,
  resolveIdentityLabel,
} from "../../shared/lib/userIdentity";
import { usePresence } from "../../shared/presence";
import { Avatar, Button, Modal } from "../../shared/ui";
import styles from "../../styles/layout/Sidebar.module.css";
import { CreateGroupDialog } from "../groups/CreateGroupDialog";
import { SettingsContent } from "../settings/SettingsContent";

type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onCloseMobileDrawer?: () => void;
  showMobileDrawerControls?: boolean;
};

const SIDEBAR_WIDTH_VAR = "--tg-sidebar-w";
const SIDEBAR_WIDTH_STORAGE_KEY = "ui.sidebar.width";
const SIDEBAR_DEFAULT_WIDTH = 360;
const SIDEBAR_MIN_WIDTH = 320;
const SIDEBAR_MAX_WIDTH = 520;

const clampSidebarWidth = (value: number): number =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)));

const normalizeActorRef = (value: string): string =>
  normalizePublicRef(value).toLowerCase();

const FriendsIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
    <path
      fill="currentColor"
      d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4Zm8 0c-.29 0-.62.02-.97.05 1.33.97 1.97 2.06 1.97 3.45v3h7v-3c0-2.66-5.33-4-8-4Z"
    />
  </svg>
);

const PublicChatIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
    <path
      fill="currentColor"
      d="M10 4a1 1 0 0 1 1 1v2h2V5a1 1 0 1 1 2 0v2h2a1 1 0 1 1 0 2h-2v4h2a1 1 0 1 1 0 2h-2v4a1 1 0 1 1-2 0v-4h-2v4a1 1 0 1 1-2 0v-4H7a1 1 0 1 1 0-2h2V9H7a1 1 0 1 1 0-2h2V5a1 1 0 0 1 1-1Zm1 5v4h2V9h-2Z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
    <path
      fill="currentColor"
      d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.62.94l-2.4-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.08.63-.08.95 0 .31.03.63.08.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.4-.96c.5.39 1.04.71 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.01-1.59ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
    />
  </svg>
);

export function Sidebar({
  user,
  onNavigate,
  onLogout,
  onCloseMobileDrawer,
  showMobileDrawerControls = false,
}: Props) {
  const { isMobileViewport } = useDevice();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { searchQuery, setSearchQuery, serverItems, refresh } =
    useConversationList();
  const { items: directItems, unreadCounts, unreadDialogsCount } =
    useDirectInbox();
  const { online: presenceOnline, status: presenceStatus } = usePresence();

  const onlineUsernames = useMemo(
    () =>
      new Set(
        presenceStatus === "online"
          ? presenceOnline.map((entry) =>
              normalizeActorRef(entry.publicRef || ""),
            )
          : [],
      ),
    [presenceOnline, presenceStatus],
  );

  const activeChatTarget = useMemo(
    () => parseChatTargetFromPathname(location.pathname),
    [location.pathname],
  );
  const directChatTargets = useMemo(
    () =>
      new Set(
        directItems
          .map((item) => normalizeChatTarget(item.peer.publicRef))
          .filter(Boolean),
      ),
    [directItems],
  );

  const isLogoActive =
    location.pathname.startsWith("/friends") ||
    (activeChatTarget !== null && directChatTargets.has(activeChatTarget));

  const isFriendsActive = location.pathname.startsWith("/friends");
  const isPublicChatActive = activeChatTarget === PUBLIC_CHAT_TARGET;
  // Shortcut в DM-pane использует тот же unread, что и public room в server rail.
  const publicChatUnread =
    serverItems.find((item) => item.isPublic)?.unreadCount ?? 0;

  const fullName = user
    ? formatFullName(
        user.name,
        (user as { last_name?: string | null }).last_name,
      )
    : "";
  const publicRef = (user?.publicRef || "").trim();
  const publicUsername = (user?.username || "").trim();
  const profileIdentity = resolveIdentityLabel(
    {
      name: fullName,
      username: publicUsername,
      publicRef,
    },
    "Без имени",
  );
  const profileHandle = resolveIdentityHandle({
    username: publicUsername,
    publicRef,
  });
  const profilePath = publicRef ? buildUserProfilePath(publicRef) : "/profile";

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredDirectItems = useMemo(() => {
    if (!normalizedSearchQuery) return directItems;

    return directItems.filter((item) => {
      const displayName = (item.peer.displayName ?? item.peer.username)
        .toLowerCase()
        .trim();
      const peerRef = normalizePublicRef(item.peer.publicRef).toLowerCase();
      const preview = item.lastMessage.toLowerCase();
      return (
        displayName.includes(normalizedSearchQuery) ||
        peerRef.includes(normalizedSearchQuery) ||
        preview.includes(normalizedSearchQuery)
      );
    });
  }, [directItems, normalizedSearchQuery]);

  const navigateFromSidebar = useCallback(
    (path: string) => {
      onCloseMobileDrawer?.();
      onNavigate(path);
    },
    [onCloseMobileDrawer, onNavigate],
  );

  const rememberedDirectPath = useMemo(() => {
    return resolveRememberedDirectPath({
      pathname: location.pathname,
      directPeerRefs: directItems.map((item) => item.peer.publicRef),
      fallbackPath: DIRECT_HOME_FALLBACK_PATH,
    });
  }, [directItems, location.pathname]);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const parsedWidth = storedValue ? Number(storedValue) : NaN;
    const width = Number.isFinite(parsedWidth)
      ? clampSidebarWidth(parsedWidth)
      : SIDEBAR_DEFAULT_WIDTH;

    document.documentElement.style.setProperty(SIDEBAR_WIDTH_VAR, `${width}px`);

    return () => {
      // Страхуемся на unmount: если drag ещё активен, снимаем подписки и курсор.
      resizeCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    const activeDirectRef = parseChatTargetFromPathname(location.pathname);
    if (!activeDirectRef || !directChatTargets.has(activeDirectRef)) return;

    // Запоминаем последнее реально открытое ЛС, чтобы логотип возвращал именно туда.
    rememberLastDirectRef(activeDirectRef);
  }, [directChatTargets, location.pathname]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    if (isMobileViewport) return;

    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    event.preventDefault();

    const startWidth = sidebarElement.getBoundingClientRect().width;
    const startX = event.clientX;

    resizeCleanupRef.current?.();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    // Пересчитываем ширину от исходной точки drag и мгновенно применяем в CSS-var shell.
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = clampSidebarWidth(startWidth + moveEvent.clientX - startX);
      document.documentElement.style.setProperty(
        SIDEBAR_WIDTH_VAR,
        `${nextWidth}px`,
      );
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(nextWidth));
    };

    const stopResize = () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
      resizeCleanupRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);
    resizeCleanupRef.current = stopResize;
  }, [isMobileViewport]);

  const handleGroupCreated = useCallback(
    (roomTarget: string) => {
      setShowCreateGroup(false);
      refresh();
      navigateFromSidebar(buildChatTargetPath(roomTarget));
    },
    [navigateFromSidebar, refresh],
  );

  const handleSettingsNavigate = useCallback(
    (path: string) => {
      setShowSettings(false);
      navigateFromSidebar(path);
    },
    [navigateFromSidebar],
  );

  const handleSettingsLogout = useCallback(async () => {
    setShowSettings(false);
    await onLogout();
  }, [onLogout]);

  return (
    <aside
      className={[
        styles.sidebar,
        showMobileDrawerControls ? styles.sidebarMobileDrawer : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={sidebarRef}
    >
      <nav className={styles.guildsSidebar} aria-label="Серверы">
        <div
          className={[
            styles.guildItem,
            isLogoActive ? styles.guildItemActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            className={[styles.guildButton, styles.guildButtonLogo].join(" ")}
            type="button"
            title="Личные сообщения"
            aria-label="Личные сообщения"
            data-testid="sidebar-logo-button"
            onClick={() => navigateFromSidebar(rememberedDirectPath)}
          >
            <img
              src="/devils_map_icon.svg"
              alt="Devils"
              className={styles.guildLogo}
            />
          </button>
        </div>

        <div className={styles.guildSeparator} />

        <div className={styles.guildsList}>
          {serverItems.map((server) => {
            const isServerActive = activeChatTarget === server.roomTarget;
            const unread = server.unreadCount;

            return (
              <div
                key={server.key}
                className={[
                  styles.guildItem,
                  isServerActive ? styles.guildItemActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  className={styles.guildButton}
                  type="button"
                  title={server.name}
                  aria-label={server.name}
                  aria-current={isServerActive ? "page" : undefined}
                  onClick={() => navigateFromSidebar(server.path)}
                >
                  {server.avatarUrl ? (
                    <img
                      src={server.avatarUrl}
                      alt={server.name}
                      className={styles.guildIcon}
                    />
                  ) : (
                    <span className={styles.guildFallback}>
                      {server.isPublic
                        ? "#"
                        : server.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className={styles.guildBadge}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {user && (
          <div className={styles.guildItem}>
            <button
              className={[styles.guildButton, styles.guildButtonCreate].join(" ")}
              type="button"
              title="Создать группу"
              aria-label="Создать группу"
              onClick={() => setShowCreateGroup(true)}
            >
              <span className={styles.guildButtonIcon}>+</span>
            </button>
          </div>
        )}
      </nav>

      <div className={styles.dmPane}>
        <div className={styles.sidebarSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск"
            aria-label="Поиск"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {showMobileDrawerControls && (
            <button
              type="button"
              className={styles.mobileCloseButton}
              onClick={onCloseMobileDrawer}
              aria-label="Закрыть меню"
              data-testid="sidebar-mobile-close"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className={styles.dmScroll} data-testid="sidebar-dm-scroll">
          <button
            type="button"
            className={[
              styles.dmLink,
              styles.dmLinkFriends,
              isFriendsActive ? styles.dmItemActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => navigateFromSidebar("/friends")}
            data-testid="friends-nav-button"
          >
            <span className={styles.dmIcon} aria-hidden="true">
              <FriendsIcon />
            </span>
            <span className={styles.dmName}>Друзья</span>
          </button>

          <button
            type="button"
            className={[
              styles.dmLink,
              styles.dmLinkShortcut,
              isPublicChatActive ? styles.dmItemActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => navigateFromSidebar(buildPublicChatPath())}
            data-testid="public-chat-nav-button"
          >
            <span
              className={[styles.dmIcon, styles.dmIconPublic].join(" ")}
              aria-hidden="true"
            >
              <PublicChatIcon />
            </span>
            <span className={styles.dmName}>Публичный чат</span>
            {publicChatUnread > 0 && (
              <span className={styles.dmBadge}>
                {publicChatUnread > 99 ? "99+" : publicChatUnread}
              </span>
            )}
          </button>

          <div className={styles.dmSectionDivider} data-testid="friends-divider" />

          <div className={styles.privateHeader}>
            <span className={styles.privateTitle}>Личные сообщения</span>
            {unreadDialogsCount > 0 && (
              <span className={styles.privateBadge}>{unreadDialogsCount}</span>
            )}
          </div>

          {!user ? (
            <div className={styles.emptyHint}>Войдите, чтобы видеть личные чаты</div>
          ) : filteredDirectItems.length === 0 ? (
            <div className={styles.emptyHint}>
              {normalizedSearchQuery
                ? "Ничего не найдено"
                : "Пока нет личных сообщений"}
            </div>
          ) : (
            <ul className={styles.dmList}>
              {filteredDirectItems.map((item) => {
                const displayName = resolveIdentityLabel(item.peer);
                const peerRef = item.peer.publicRef;
                const directTarget = normalizeChatTarget(peerRef);
                const directPath = buildDirectPath(peerRef);
                const isDirectActive =
                  Boolean(directTarget) && activeChatTarget === directTarget;
                const isPeerOnline = onlineUsernames.has(
                  normalizeActorRef(peerRef),
                );
                const unread = unreadCounts[String(item.roomId)] ?? 0;

                return (
                  <li key={item.roomId} className={styles.dmItem}>
                    <button
                      type="button"
                      className={[
                        styles.dmLink,
                        isDirectActive ? styles.dmItemActive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => navigateFromSidebar(directPath)}
                      aria-current={isDirectActive ? "page" : undefined}
                    >
                      <Avatar
                        username={displayName}
                        profileImage={item.peer.profileImage}
                        avatarCrop={item.peer.avatarCrop}
                        size="tiny"
                        online={isPeerOnline}
                      />
                      <span className={styles.dmName} title={displayName}>
                        {displayName}
                      </span>
                      {unread > 0 && (
                        <span className={styles.dmBadge}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {user ? (
        <section className={styles.userPanel}>
          <button
            className={styles.userProfileButton}
            type="button"
            onClick={() => navigateFromSidebar(profilePath)}
          >
            <Avatar
              username={profileIdentity}
              profileImage={user.profileImage}
              avatarCrop={user.avatarCrop}
              size="tiny"
            />
            <div className={styles.userMeta}>
              <span className={styles.userName}>{profileIdentity}</span>
              {profileHandle && (
                <span className={styles.userStatus}>{profileHandle}</span>
              )}
            </div>
          </button>

          <div className={styles.userControls}>
            <button
              className={styles.controlButton}
              type="button"
              title="Настройки"
              aria-label="Открыть настройки"
              onClick={() => setShowSettings(true)}
              data-testid="sidebar-settings-button"
            >
              <SettingsIcon />
            </button>
          </div>
        </section>
      ) : (
        <div className={styles.authButtons}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigateFromSidebar("/login")}
          >
            Войти
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => navigateFromSidebar("/register")}
          >
            Регистрация
          </Button>
        </div>
      )}

      <div
        className={styles.sidebarResizeHandle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину боковой панели"
        onMouseDown={handleResizeStart}
      />

      {showCreateGroup && (
        <CreateGroupDialog
          onCreated={handleGroupCreated}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Настройки"
      >
        <SettingsContent
          user={user}
          onNavigate={handleSettingsNavigate}
          onLogout={handleSettingsLogout}
          compact={true}
          showTitle={false}
        />
      </Modal>
    </aside>
  );
}
