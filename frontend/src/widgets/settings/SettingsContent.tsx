import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import type { UserProfile } from "../../entities/user/types";
import { avatarFallback } from "../../shared/lib/format";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { useNotifications } from "../../shared/notifications";
import { AvatarMedia, Button, EmptyState } from "../../shared/ui";
import styles from "../../styles/pages/SettingsPage.module.css";
import { SecuritySettingsSection } from "./SecuritySettingsSection";

type SaveResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string[]>; message?: string };

type ProfileSaveInput = {
  name?: string;
  username?: string;
  image?: File | null;
  bio?: string;
};

type Props = {
  user: UserProfile | null;
  onProfileSave: (fields: ProfileSaveInput) => Promise<SaveResult>;
  compact?: boolean;
  showTitle?: boolean;
};

type NotificationKey = "sound" | "comments" | "replies" | "likes" | "mentions";

const notificationRows: Array<{
  key: NotificationKey;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    key: "sound",
    title: "Звук при новом уведомлении",
    description: "Короткий сигнал, когда счетчик непрочитанных растет.",
    icon: "sound",
  },
  {
    key: "comments",
    title: "Комментарии к моим постам",
    description: "Ответы под твоими работами и публикациями.",
    icon: "comment",
  },
  {
    key: "replies",
    title: "Ответы на мои комментарии",
    description: "Когда кто-то отвечает в ветке, где ты писал.",
    icon: "reply",
  },
  {
    key: "likes",
    title: "Лайки в галерее",
    description: "Кто поставил лайк твоему скриншоту.",
    icon: "heart",
  },
  {
    key: "mentions",
    title: "Упоминания",
    description: "Когда вас упоминают через @ник в комментариях или галерее.",
    icon: "mention",
  },
];

const SettingsIcon = ({ name }: { name: string }) => {
  if (name === "sound") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 9v6h4l5 4V5L9 9H5Zm12.5-.5a5 5 0 0 1 0 7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "reply") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 9 5 13l4 4M6 13h8a5 5 0 0 1 5 5v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-7-4.4-9-9a4.4 4.4 0 0 1 7-5 4.4 4.4 0 0 1 7 5c-2 4.6-9 9-9 9Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "mention") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16 12a4 4 0 1 1-1.1-2.75V12a2.1 2.1 0 0 0 4.2 0 7.1 7.1 0 1 0-2.4 5.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6h14v11H8l-3 3V6Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
};

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 20h4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export function SettingsContent({
  user,
  onProfileSave,
  compact = false,
  showTitle = true,
}: Props) {
  const notifications = useNotifications();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<
    Record<NotificationKey, boolean>
  >({
    sound:
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
    comments: true,
    replies: true,
    likes: true,
    mentions: true,
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
    });
    setAvatarFile(null);
    setFieldErrors({});
  }, [user?.name, user?.username, user?.bio, user?.publicRef]);

  useEffect(() => {
    previewUrlRef.current = avatarPreviewUrl;
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  if (!user) {
    return (
      <EmptyState
        title="Авторизуйтесь"
        description="Для доступа к настройкам войдите в аккаунт."
      />
    );
  }

  const avatarIdentity = resolveIdentityLabel(user, "user");
  const avatarUrl = avatarPreviewUrl ?? user.profileImage;
  const bioLength = profileForm.bio.length;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    clearFieldError("image");
    event.currentTarget.value = "";
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await onProfileSave({
        name: profileForm.name,
        username: profileForm.username,
        bio: profileForm.bio,
        image: avatarFile || undefined,
      });
      if (!result.ok) {
        setFieldErrors(result.errors || {});
        if (result.message) notifications.error(result.message);
        return;
      }
      setFieldErrors({});
      setAvatarFile(null);
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNotification = async (key: NotificationKey) => {
    if (
      key === "sound" &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      const result = await Notification.requestPermission();
      setNotificationPrefs((prev) => ({
        ...prev,
        sound: result === "granted",
      }));
      return;
    }
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>
            <ProfileIcon />
          </span>
          <h2>Профиль</h2>
        </header>

        <form className={styles.profileForm} onSubmit={handleProfileSubmit}>
          <div className={styles.profileTopRow}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Изменить аватар"
            >
              {avatarUrl ? (
                <AvatarMedia
                  src={avatarUrl}
                  alt={avatarIdentity}
                  avatarCrop={avatarFile ? null : user.avatarCrop}
                  loading="eager"
                />
              ) : (
                <span>{avatarFallback(avatarIdentity)}</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />

            <div className={styles.profileFields}>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) => {
                    setProfileForm({
                      ...profileForm,
                      name: event.target.value,
                    });
                    clearFieldError("name");
                  }}
                />
                {fieldErrors.name?.[0] && (
                  <small className={styles.errorText}>
                    {fieldErrors.name[0]}
                  </small>
                )}
              </label>
              <label className={styles.field}>
                <span>Юзернейм</span>
                <input
                  type="text"
                  aria-label="Юзернейм (@username)"
                  value={profileForm.username}
                  onChange={(event) => {
                    setProfileForm({
                      ...profileForm,
                      username: event.target.value,
                    });
                    clearFieldError("username");
                  }}
                />
                {fieldErrors.username?.[0] && (
                  <small className={styles.errorText}>
                    {fieldErrors.username[0]}
                  </small>
                )}
              </label>
            </div>
          </div>

          <label className={styles.field}>
            <span>Краткая информация</span>
            <textarea
              value={profileForm.bio}
              aria-label="Биография (необязательно)"
              maxLength={100}
              placeholder="Коротко о себе..."
              onChange={(event) => {
                setProfileForm({ ...profileForm, bio: event.target.value });
                clearFieldError("bio");
              }}
            />
            <small className={styles.counter}>{bioLength}/100</small>
            {fieldErrors.bio?.[0] && (
              <small className={styles.errorText}>{fieldErrors.bio[0]}</small>
            )}
            {fieldErrors.image?.[0] && (
              <small className={styles.errorText}>{fieldErrors.image[0]}</small>
            )}
          </label>

          <div className={styles.profileActions}>
            <Button type="submit" variant="outline" disabled={savingProfile}>
              {savingProfile ? "Сохраняем..." : "Сохранить профиль"}
            </Button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>
            <BellIcon />
          </span>
          <h2>Уведомления</h2>
        </header>
        <p className={styles.sectionLead}>
          Сохраняются в аккаунте, одинаково на всех устройствах и браузерах.
          Звук в колокольчике подстраивается под эти настройки.
        </p>

        <div className={styles.settingsList}>
          {notificationRows.map((row) => (
            <div className={styles.settingRow} key={row.key}>
              <span className={styles.settingIcon}>
                <SettingsIcon name={row.icon} />
              </span>
              <div className={styles.settingText}>
                <strong>{row.title}</strong>
                <span>{row.description}</span>
              </div>
              <button
                type="button"
                className={[
                  styles.toggle,
                  notificationPrefs[row.key] ? styles.toggleActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => void toggleNotification(row.key)}
                aria-label={row.title}
                aria-pressed={notificationPrefs[row.key]}
              >
                <span />
              </button>
            </div>
          ))}
        </div>
      </section>

      <SecuritySettingsSection enabled={Boolean(user)} />
    </div>
  );
}
