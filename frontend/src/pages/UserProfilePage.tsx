import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import type { UserProfile } from "../entities/user/types";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  avatarFallback,
  formatFullName,
  formatLastSeen,
  formatRegistrationDate,
} from "../shared/lib/format";
import {
  buildDirectPath,
  formatPublicRef,
  normalizePublicRef,
} from "../shared/lib/publicRef";
import { resolveIdentityLabel } from "../shared/lib/userIdentity";
import { usePresence } from "../shared/presence";
import { AvatarMedia, Button, Card, PageState, Skeleton } from "../shared/ui";
import styles from "../styles/pages/UserProfilePage.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  onLogout: () => void;
  username: string;
  currentUser: UserProfile | null;
  onNavigate: (path: string) => void;
};

/**
 * Нормализует actor ref.
 * @param value Входное значение для преобразования.
 * @returns Нормализованное значение после обработки входа.
 */
const normalizeActorRef = (value: string): string =>
  normalizePublicRef(value).toLowerCase();

function UserProfileSkeleton() {
  return (
    <Card wide className={styles.profileSkeletonCard} aria-busy="true">
      <Skeleton
        variant="text"
        width={180}
        height={22}
        className={styles.profileSkeletonEyebrow}
      />
      <div className={styles.profileAvatarWrapper}>
        <Skeleton variant="circle" width="100%" height="100%" />
      </div>
      <div className={styles.stack}>
        <Skeleton variant="text" width="46%" height={18} />
        <Skeleton variant="text" width="34%" height={14} />
        <Skeleton variant="text" width="58%" height={14} />
        <Skeleton height={82} radius={12} />
        <div className={styles.profileSkeletonActions}>
          <Skeleton height={42} radius={10} />
          <Skeleton height={42} radius={10} />
        </div>
      </div>
    </Card>
  );
}

/**
 * Компонент UserProfilePage рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function UserProfilePage({
  username,
  currentUser,
  onNavigate,
  onLogout,
}: Props) {
  const { user, loading, error } = useUserProfile(username);
  const { online: presenceOnline, status: presenceStatus } = usePresence();
  const currentPublicRef = normalizePublicRef(currentUser?.publicRef || "");
  const routePublicRef = normalizePublicRef(username);
  const isSelfRoute =
    Boolean(currentPublicRef) && currentPublicRef === routePublicRef;
  const profileUser = isSelfRoute ? currentUser : user;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement | null>(null);

  const hasProfileImage = Boolean(profileUser?.profileImage);
  const pinchState = useRef<{ distance: number; zoom: number } | null>(null);
  const dragState = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  /**
   * Обрабатывает clamp zoom.
   * @param value Входное значение для преобразования.
   */
  const clampZoom = (value: number) => Math.min(15, Math.max(1, value));

  /**
   * Обрабатывает clamp pan.
   * @param nextX Новое состояние или значение после изменения.
   * @param nextY Новое состояние или значение после изменения.
   * @param zoomValue DOM-событие, вызвавшее обработчик.
   */
  const clampPan = (nextX: number, nextY: number, zoomValue: number = zoom) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: nextX, y: nextY };
    }
    const currentZoom = zoom || 1;
    const baseWidth = rect.width / currentZoom;
    const baseHeight = rect.height / currentZoom;
    const nextWidth = baseWidth * zoomValue;
    const nextHeight = baseHeight * zoomValue;
    const maxX = Math.max(0, (nextWidth - window.innerWidth) / 2);
    const maxY = Math.max(0, (nextHeight - window.innerHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    };
  };

  /**
   * Обрабатывает apply zoom at point.
   * @param clientX Аргумент `clientX` текущего вызова.
   * @param clientY Аргумент `clientY` текущего вызова.
   * @param nextZoom Новое состояние или значение после изменения.
   */
  const applyZoomAtPoint = (
    clientX: number,
    clientY: number,
    nextZoom: number,
  ) => {
    const rect = contentRef.current?.getBoundingClientRect();
    setZoom((currentZoom) => {
      const clampedZoom = clampZoom(nextZoom);
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        if (clampedZoom <= 1) {
          setPan({ x: 0, y: 0 });
        }
        return clampedZoom;
      }
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      const dx = offsetX - rect.width / 2;
      const dy = offsetY - rect.height / 2;
      const scale = clampedZoom / currentZoom;
      setPan((prev) => {
        const nextPan = {
          x: prev.x - dx * (scale - 1),
          y: prev.y - dy * (scale - 1),
        };
        return clampedZoom <= 1
          ? { x: 0, y: 0 }
          : clampPan(nextPan.x, nextPan.y, clampedZoom);
      });
      return clampedZoom;
    });
  };

  /**
   * Обрабатывает open preview.
   */
  const openPreview = () => {
    if (!hasProfileImage) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pinchState.current = null;
    dragState.current = null;
    setIsPreviewOpen(true);
  };
  /**
   * Обрабатывает close preview.
   */
  const closePreview = () => setIsPreviewOpen(false);

  /**
   * Обрабатывает handle wheel.
   * @param event Событие браузера.
   */
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    const step = event.deltaY < 0 ? 0.2 : -0.2;
    applyZoomAtPoint(event.clientX, event.clientY, zoom + step);
  };

  /**
   * Возвращает touch distance.
   * @param touches Список `touches`, который обрабатывается функцией.
   */
  const getTouchDistance = (
    touches: ReactTouchEvent<HTMLDivElement>["touches"],
  ) => {
    if (touches.length < 2) return null;
    const first = touches.item(0);
    const second = touches.item(1);
    if (!first || !second) return null;
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    return Math.hypot(dx, dy);
  };

  /**
   * Обрабатывает handle touch start.
   * @param event Событие браузера.
   */
  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1 && zoom > 1) {
      const touch = event.touches.item(0);
      if (!touch) return;
      dragState.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    const distance = getTouchDistance(event.touches);
    if (!distance) return;
    pinchState.current = {
      distance,
      zoom,
    };
  };

  /**
   * Обрабатывает handle touch move.
   * @param event Событие браузера.
   */
  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (dragState.current && event.touches.length === 1) {
      const touch = event.touches.item(0);
      if (!touch) return;
      if (event.cancelable) {
        event.preventDefault();
      }
      const nextX =
        dragState.current.panX + (touch.clientX - dragState.current.x);
      const nextY =
        dragState.current.panY + (touch.clientY - dragState.current.y);
      setPan(clampPan(nextX, nextY));
      return;
    }

    if (!pinchState.current) return;
    const nextDistance = getTouchDistance(event.touches);
    if (!nextDistance) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    const first = event.touches.item(0);
    const second = event.touches.item(1);
    const scale = nextDistance / pinchState.current.distance;
    const nextZoom = clampZoom(pinchState.current.zoom * scale);
    if (first && second) {
      const centerX = (first.clientX + second.clientX) / 2;
      const centerY = (first.clientY + second.clientY) / 2;
      applyZoomAtPoint(centerX, centerY, nextZoom);
    } else {
      setZoom(nextZoom);
      setPan((prev) =>
        nextZoom <= 1 ? { x: 0, y: 0 } : clampPan(prev.x, prev.y, nextZoom),
      );
    }
  };

  /**
   * Обрабатывает handle touch end.
   */
  const handleTouchEnd = () => {
    pinchState.current = null;
    dragState.current = null;
  };

  /**
   * Обрабатывает handle mouse down.
   * @param event Событие браузера.
   */
  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    event.preventDefault();
    dragState.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  /**
   * Обрабатывает handle mouse move.
   * @param event Событие браузера.
   */
  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    event.preventDefault();
    const nextX =
      dragState.current.panX + (event.clientX - dragState.current.x);
    const nextY =
      dragState.current.panY + (event.clientY - dragState.current.y);
    setPan(clampPan(nextX, nextY));
  };

  /**
   * Обрабатывает handle mouse up.
   */
  const handleMouseUp = () => {
    dragState.current = null;
  };

  /**
   * Обрабатывает handle avatar key down.
   * @param event Событие браузера.
   */
  const handleAvatarKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!hasProfileImage) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview();
    }
  };

  useEffect(() => {
    if (!isPreviewOpen) return;
    /**
     * Обрабатывает on key down.
     * @param event Событие браузера.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewOpen]);

  if (loading && !profileUser) {
    return <UserProfileSkeleton />;
  }

  if (error || !profileUser) {
    return (
      <PageState
        tone="warning"
        eyebrow="Профиль"
        title="Профиль не найден"
        description="Пользователь мог изменить публичный адрес, удалить аккаунт или ссылка была введена с ошибкой."
        icon={
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0M18 6l3 3M21 6l-3 3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        }
      >
        <Button variant="outline" onClick={() => onNavigate("/public")}>
          Вернуться в чат
        </Button>
      </PageState>
    );
  }

  const profilePublicRef = normalizePublicRef(
    profileUser.publicRef || routePublicRef,
  );
  const isSelf =
    Boolean(currentPublicRef) && currentPublicRef === profilePublicRef;
  const fullName =
    formatFullName(
      profileUser.name,
      (profileUser as { last_name?: string | null }).last_name,
    ) || resolveIdentityLabel(profileUser, "Без имени");
  const publicRef = (profileUser.publicRef || routePublicRef).trim();
  const avatarIdentity = resolveIdentityLabel(profileUser, "user");
  const normalizedTargetRef = normalizeActorRef(publicRef);
  const isUserOnline =
    presenceStatus === "online" &&
    presenceOnline.some(
      (entry) => normalizeActorRef(entry.publicRef) === normalizedTargetRef,
    );

  return (
    <Card wide className={styles.profileCard}>
      <h1 className={styles.title}>Профиль</h1>
      <section className={styles.profileHero}>
        <div

          // className={[
          //   styles.profileAvatarWrapper,
          //   isUserOnline ? styles.online : "",
          // ]
          //   .filter(Boolean)
          //   .join(" ")}
          
          data-online={isUserOnline ? "true" : "false"}
        >
          <div
            className={[
              styles.profileAvatar,
              styles.readonly,
              hasProfileImage ? styles.clickable : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role={hasProfileImage ? "button" : undefined}
            data-testid={hasProfileImage ? "profile-avatar-open" : undefined}
            tabIndex={hasProfileImage ? 0 : -1}
            aria-label={hasProfileImage ? "Открыть аватар" : undefined}
            onClick={openPreview}
            onKeyDown={handleAvatarKeyDown}
          >
            {profileUser.profileImage ? (
              <AvatarMedia
                src={profileUser.profileImage}
                alt={avatarIdentity}
                avatarCrop={profileUser.avatarCrop}
                loading="eager"
              />
            ) : (
              <span>{avatarFallback(avatarIdentity)}</span>
            )}
          </div>
        </div>

        <div className={styles.profileSummary}>
          <p className={styles.eyebrowProfile}>Профиль пользователя</p>
          <h1 className={styles.profileName}>{fullName}</h1>
          {publicRef && (
            <p className={styles.usernameHandle}>
              {formatPublicRef(publicRef)}
            </p>
          )}

          {/* <span
            className={[
              styles.statusChip,
              isUserOnline ? styles.statusChipOnline : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isUserOnline
              ? "В сети"
              : `Последний раз в сети: ${formatLastSeen(profileUser.lastSeen) || "—"}`}
          </span> */}


        </div>
      </section>

      {isPreviewOpen && profileUser.profileImage && (
        <div
          className={styles.avatarLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Аватар ${avatarIdentity}`}
          onClick={closePreview}
        >
          <div
            className={[
              styles.avatarLightboxContent,
              zoom > 1 ? styles.zoomed : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={contentRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
            onClick={(event) => event.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <img
              className={styles.avatarLightboxImage}
              src={profileUser.profileImage}
              alt={`Аватар ${avatarIdentity}`}
              draggable={false}
            />
          </div>
        </div>
      )}

      <div className={styles.stack}>
        <section
          className={styles.section}
          data-testid={
            profileUser.bio?.trim() ? "profile-bio-section" : undefined
          }
        >
          <header className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </span>
            <h2>Информация</h2>
          </header>
          <div className={styles.bioBlock}>
            <p className={styles.muted}>Краткая информация</p>
            <p className={styles.bioText}>
              {profileUser.bio?.trim() || "Тут пока что нет ничего."}
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 3.5 18.5 6v5.25c0 4.1-2.55 7.65-6.5 9.25-3.95-1.6-6.5-5.15-6.5-9.25V6L12 3.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </span>
            <h2>Аккаунт</h2>
          </header>
          <dl className={styles.profileMetaGrid}>
            <div>
              <dt>Статус</dt>
              <dd>
                {isUserOnline
                  ? "В сети"
                  : `Последний раз в сети: ${formatLastSeen(profileUser.lastSeen) || "—"}`}
              </dd>
            </div>
            <div>
              <dt>Регистрация</dt>
              <dd>{formatRegistrationDate(profileUser.registeredAt) || "—"}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.actions}>
          {isSelf && (
            <Button variant="primary" onClick={() => onNavigate("/settings")}>
              Редактировать
            </Button>
          )}
          {!isSelf && currentUser && publicRef && (
            <Button
              variant="primary"
              onClick={() => onNavigate(buildDirectPath(publicRef))}
              data-testid="send-dm-button"
            >
              Отправить сообщение
            </Button>
          )}
          <Button variant="ghost" onClick={() => onNavigate("/public")}>
            Вернуться в чат
          </Button>
          {isSelf && (
            <Button
              variant="danger"
              onClick={onLogout}
              data-testid="logout-button"
            >
              Выйти
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
