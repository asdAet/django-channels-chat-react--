import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { avatarFallback, formatRegistrationDate } from "../shared/lib/format";
import type { UserProfile } from "../entities/user/types";
import { useUserProfile } from "../hooks/useUserProfile";

type Props = {
  user: UserProfile | null;
  onLogout: () => void;
  username: string;
  currentUser: UserProfile | null;
  onNavigate: (path: string) => void;
};

export function UserProfilePage({
  username,
  currentUser,
  onNavigate,
  onLogout,
}: Props) {
  const { user, loading, error } = useUserProfile(username);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const hasProfileImage = Boolean(user?.profileImage);

  const openPreview = () => {
    if (!hasProfileImage) return;
    setIsPreviewOpen(true);
  };
  const closePreview = () => setIsPreviewOpen(false);

  const handleAvatarKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!hasProfileImage) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview();
    }
  };

  useEffect(() => {
    if (!isPreviewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewOpen]);

  if (loading) {
    return (
      <div className="panel muted" aria-busy="true">
        Загрузка профиля...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="panel">
        <p>Профиль не найден.</p>
        <div className="actions">
          <button className="btn ghost" onClick={() => onNavigate("/")}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  const isSelf = currentUser?.username === user.username;

  return (
    <div className="card wide">
      <div>
        <p className="eyebrow_profile">Профиль пользователя</p>
      </div>

      <div className="profile_avatar_wrapper">
        <div
          className={`profile_avatar readonly${hasProfileImage ? " clickable" : ""}`}
          role={hasProfileImage ? "button" : undefined}
          tabIndex={hasProfileImage ? 0 : -1}
          aria-label={hasProfileImage ? "Открыть аватар" : undefined}
          onClick={openPreview}
          onKeyDown={handleAvatarKeyDown}
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.username} />
          ) : (
            <span>{avatarFallback(user.username)}</span>
          )}
        </div>
      </div>

      {isPreviewOpen && user.profileImage && (
        <div
          className="avatar-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Аватар ${user.username}`}
          onClick={closePreview}
        >
          <div
            className="avatar-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="avatar-lightbox__image"
              src={user.profileImage}
              alt={`Аватар ${user.username}`}
              draggable={false}
            />
          </div>
        </div>
      )}

      <div className="stack">
        <div>
          <h2>{user.username}</h2>
          <p className="muted">О себе</p>
          <p className="bio-text">{user.bio || "Пока ничего не указано."}</p>
          <p className="profile_meta profile_meta_right">
            Зарегистрирован: {formatRegistrationDate(user.registeredAt) || '—'}
          </p>
        </div>
        <div className="actions">
          {isSelf && (
            <button className="btn primary" onClick={() => onNavigate('/profile')}>
              Редактировать
            </button>
          )}
          <button className="btn ghost" onClick={() => onNavigate("/")}>
            На главную
          </button>
          {isSelf && (
            <button className="btn logaut" type="button" onClick={onLogout}>
              Выйти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
