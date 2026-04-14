import { Route, Routes, useParams } from "react-router-dom";

import { decodePublicRefParam } from "../dto";
import type { UserProfile } from "../entities/user/types";
import { ChatTargetPage } from "../pages/ChatTargetPage";
import { FriendsPage } from "../pages/FriendsPage";
import { GroupsPage } from "../pages/GroupsPage";
import { HomePage } from "../pages/HomePage";
import { InvitePreviewPage } from "../pages/InvitePreviewPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { UserProfilePage } from "../pages/UserProfilePage";
import { isReservedChatTarget, normalizeChatTarget } from "../shared/lib/chatTarget";

type ProfileFieldErrors = Record<string, string[]>;
type ProfileSaveResult =
  | { ok: true }
  | { ok: false; errors?: ProfileFieldErrors; message?: string };

/**
 * Контракт навигационного слоя приложения.
 *
 * @property user Текущий авторизованный пользователь или `null` для гостя.
 * @property error Сообщение последней auth-ошибки, которое нужно показать на login/register.
 * @property passwordRules Список правил для отображения под формой регистрации.
 * @property googleAuthDisabledReason Причина, по которой кнопка Google OAuth недоступна.
 * @property onNavigate Унифицированный переход между страницами.
 * @property onLogin Выполняет вход по логину и паролю.
 * @property onGoogleOAuth Запускает сценарий входа через Google, если он доступен.
 * @property onRegister Создает аккаунт по данным формы регистрации.
 * @property onLogout Завершает пользовательскую сессию.
 * @property onProfileSave Сохраняет обновления профиля и возвращает результат валидации.
 */
type AppRoutesProps = {
  user: UserProfile | null;
  error: string | null;
  passwordRules: string[];
  googleAuthDisabledReason: string | null;
  onNavigate: (path: string) => void;
  onLogin: (identifier: string, password: string) => Promise<void>;
  onGoogleOAuth?: () => Promise<void>;
  onRegister: (payload: {
    login: string;
    password: string;
    passwordConfirm: string;
    name: string;
    username?: string;
    email?: string;
  }) => Promise<void>;
  onLogout: () => Promise<void>;
  onProfileSave: (fields: {
    name?: string;
    username?: string;
    image?: File | null;
    bio?: string;
  }) => Promise<ProfileSaveResult>;
};

function UserProfileRoute({
  user,
  onNavigate,
  onLogout,
}: Pick<AppRoutesProps, "user" | "onNavigate" | "onLogout">) {
  const params = useParams<{ ref: string }>();
  const ref = decodePublicRefParam(params.ref);
  if (!ref) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  return (
    <UserProfilePage
      key={ref}
      user={user}
      username={ref}
      currentUser={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    />
  );
}

function ChatTargetRoute({
  user,
  onNavigate,
}: Pick<AppRoutesProps, "user" | "onNavigate">) {
  const params = useParams<{ target: string }>();
  const rawTarget = params.target ?? "";
  if (!rawTarget || isReservedChatTarget(rawTarget)) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  const target = normalizeChatTarget(rawTarget);
  if (!target) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  return (
    <ChatTargetPage
      key={target}
      user={user}
      target={target}
      onNavigate={onNavigate}
    />
  );
}

function InviteRoute({ onNavigate }: Pick<AppRoutesProps, "onNavigate">) {
  const params = useParams<{ code: string }>();
  const code = params.code || "";
  if (!code) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }
  return <InvitePreviewPage code={code} onNavigate={onNavigate} />;
}

/**
 * Описывает таблицу маршрутов SPA и связывает URL с экранами приложения.
 *
 * Компонент принимает готовые auth- и navigation-колбэки из верхнего уровня,
 * а затем прокидывает их в конкретные страницы: вход, регистрацию, профиль,
 * настройки, друзей, группы, приглашения и канонический маршрут чата по target.
 */
export function AppRoutes({
  user,
  error,
  passwordRules,
  googleAuthDisabledReason,
  onNavigate,
  onLogin,
  onGoogleOAuth,
  onRegister,
  onLogout,
  onProfileSave,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage user={user} onNavigate={onNavigate} />}
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onSubmit={onLogin}
            onGoogleAuth={onGoogleOAuth}
            onNavigate={onNavigate}
            googleAuthDisabledReason={googleAuthDisabledReason}
            error={error}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onSubmit={onRegister}
            onGoogleAuth={onGoogleOAuth}
            googleAuthDisabledReason={googleAuthDisabledReason}
            onNavigate={onNavigate}
            error={error}
            passwordRules={passwordRules}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ProfilePage
            key={user?.username || "guest"}
            user={user}
            onSave={onProfileSave}
            onNavigate={onNavigate}
          />
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsPage
            user={user}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        }
      />
      <Route
        path="/friends"
        element={<FriendsPage user={user} onNavigate={onNavigate} />}
      />
      <Route
        path="/groups"
        element={<GroupsPage user={user} onNavigate={onNavigate} />}
      />
      <Route
        path="/invite/:code"
        element={<InviteRoute onNavigate={onNavigate} />}
      />
      <Route
        path="/users/:ref"
        element={
          <UserProfileRoute
            user={user}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        }
      />
      <Route
        path="/:target"
        element={<ChatTargetRoute user={user} onNavigate={onNavigate} />}
      />
      <Route path="*" element={<NotFoundPage onNavigate={onNavigate} />} />
    </Routes>
  );
}
