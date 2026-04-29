import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { usePasswordRules } from "../hooks/usePasswordRules";
import { HomePage } from "../pages/HomePage";
import type { ApiError } from "../shared/api/types";
import type { AvatarCrop } from "../shared/api/users";
import { startGoogleAuthRedirect } from "../shared/auth/googleRedirect";
import { ChatRealtimeProvider } from "../shared/chatRealtime";
import { useRuntimeConfig } from "../shared/config/RuntimeConfigContext";
import { RuntimeConfigProvider } from "../shared/config/RuntimeConfigProvider";
import { DirectInboxProvider } from "../shared/directInbox";
import {
  buildPublicChatPath,
  isPrefixlessChatPath,
} from "../shared/lib/chatTarget";
import { debugLog } from "../shared/lib/debug";
import { DeviceProvider } from "../shared/lib/device";
import { useViewportCssVars } from "../shared/lib/viewport/useViewportCssVars";
import {
  NotificationProvider,
  useNotifications,
} from "../shared/notifications";
import { PresenceProvider } from "../shared/presence";
import { RoomReadStateProvider } from "../shared/roomReadState";
import { SiteVisitTelemetry } from "../shared/visitorTelemetry";
import { WsAuthProvider } from "../shared/wsAuth";
import appStyles from "../styles/app/AppAuthPage.module.css";
import { LoginTwoFactorModal } from "../widgets/auth/LoginTwoFactorModal";
import { AppShell } from "../widgets/layout/AppShell";
import { AppRoutes } from "./routes";
import { useAuthEntryNavigation } from "./useAuthEntryNavigation";

type SeoDescriptor = {
  title: string;
  description: string;
  robots: string;
};

const DEFAULT_SEO: SeoDescriptor = {
  title: "Devil — realtime-мессенджер",
  description:
    "Devil — мессенджер для личных и групповых чатов с вложениями, ролями, модерацией и realtime-статусами.",
  robots:
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
};

const PRIVATE_ROUTE_SEO: SeoDescriptor = {
  title: "Devil — личный раздел",
  description: "Личный раздел пользователя Devil.",
  robots: "noindex,nofollow",
};

const MATCHED_ROUTE_SEO: Array<{
  match: (pathname: string) => boolean;
  meta: SeoDescriptor;
}> = [
  {
    match: (pathname) => pathname === "/",
    meta: DEFAULT_SEO,
  },
  {
    match: (pathname) =>
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/profile" ||
      pathname === "/settings",
    meta: PRIVATE_ROUTE_SEO,
  },
  {
    match: (pathname) => pathname === "/friends",
    meta: {
      title: "Друзья — Devil",
      description:
        "Управляйте списком друзей, заявками и личными контактами в Devil.",
      robots: "noindex,nofollow",
    },
  },
  {
    match: (pathname) => pathname === "/groups",
    meta: {
      title: "Группы — Devil",
      description: "Создавайте и администрируйте групповые чаты в Devil.",
      robots: "noindex,nofollow",
    },
  },
  {
    match: (pathname) => isPrefixlessChatPath(pathname),
    meta: {
      title: "Чат — Devil",
      description: "Личные и групповые чаты Devil.",
      robots: "noindex,nofollow",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/invite/"),
    meta: {
      title: "Приглашение в группу — Devil",
      description: "Просмотр приглашения в группу Devil.",
      robots: "noindex,nofollow",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/users/"),
    meta: {
      title: "Профиль пользователя — Devil",
      description: "Публичный профиль пользователя Devil.",
      robots: "noindex,nofollow",
    },
  },
];

/**
 * Возвращает SEO-описание для текущего пути.
 */
const resolveSeoDescriptor = (pathname: string): SeoDescriptor => {
  const matched = MATCHED_ROUTE_SEO.find((item) => item.match(pathname));
  return matched?.meta ?? DEFAULT_SEO;
};

/**
 * Обновляет или создает meta-тег по имени.
 */
const upsertMetaByName = (name: string, content: string) => {
  let node = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  );
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.append(node);
  }
  node.setAttribute("content", content);
};

/**
 * Обновляет или создает meta-тег по property.
 */
const upsertMetaByProperty = (property: string, content: string) => {
  let node = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("property", property);
    document.head.append(node);
  }
  node.setAttribute("content", content);
};

/**
 * Обновляет или создает canonical-ссылку.
 */
const upsertCanonicalLink = (href: string) => {
  let node = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.append(node);
  }
  node.setAttribute("href", href);
};

/**
 * Описывает структуру данных `ProfileFieldErrors`.
 */
type ProfileFieldErrors = Record<string, string[]>;
/**
 * Описывает результат операции `ProfileSave`.
 */
type ProfileSaveResult =
  | { ok: true }
  | { ok: false; errors?: ProfileFieldErrors; message?: string };

/**
 * React-компонент AppWorkspace отвечает за отрисовку рабочей части приложения.
 */
function AppWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: runtimeConfig } = useRuntimeConfig();
  const {
    auth,
    login,
    confirmLoginTwoFactor,
    register,
    logout,
    updateProfile,
  } = useAuth();
  const notifications = useNotifications();
  const [loginTwoFactorOpen, setLoginTwoFactorOpen] = useState(false);
  const { rules: passwordRules } = usePasswordRules(
    location.pathname === "/register",
  );
  const notifiedOauthErrorRef = useRef<string | null>(null);

  /**
   * Извлекает message.
   * @param err Объект ошибки, полученный в обработчике.
   */
  const extractMessage = (err: unknown) => {
    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as ApiError).message === "string"
    ) {
      const apiErr = err as ApiError;
      const apiErrors =
        apiErr.data &&
        (apiErr.data.errors as Record<string, string[]> | undefined);
      if (apiErrors) {
        return Object.values(apiErrors).flat().join(" ");
      }
      if (
        apiErr.status === 400 &&
        apiErr.message?.includes("status code 400")
      ) {
        return "Проверьте введённые данные и попробуйте снова.";
      }
      return apiErr.message;
    }
    return "Не удалось выполнить запрос. Попробуйте еще раз.";
  };

  /**
   * Извлекает auth message.
   * @param err Объект ошибки, полученный в обработчике.
   * @param fallback Резервное значение на случай ошибки или отсутствия данных.
   */
  const extractAuthMessage = (err: unknown, fallback: string) => {
    /**
     * Извлекает from data.
     * @param data Входные данные операции.
     */
    const extractFromData = (data: unknown) => {
      if (!data || typeof data !== "object") return null;
      const record = data as Record<string, unknown>;
      const errors = record.errors as
        | Record<string, string[] | string>
        | undefined;
      if (errors) {
        const parts = Object.values(errors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((value) => typeof value === "string") as string[];
        if (parts.length) return parts.join(" ");
      }
      if (typeof record.message === "string") return record.message;
      if (typeof record.error === "string") return record.error;
      if (typeof record.detail === "string") return record.detail;
      return null;
    };

    if (err && typeof err === "object") {
      const anyErr = err as ApiError & { response?: { data?: unknown } };
      const direct =
        extractFromData(anyErr.data) || extractFromData(anyErr.response?.data);
      if (direct) return direct;

      if ("message" in anyErr) {
        const rawMessage =
          typeof anyErr.message === "string" ? anyErr.message.trim() : "";
        if (rawMessage && !rawMessage.includes("status code 400")) {
          return rawMessage;
        }
        if (anyErr.status === 400) {
          return fallback;
        }
      }
    }
    return fallback;
  };

  /**
   * Извлекает profile errors.
   * @param err Объект ошибки, полученный в обработчике.
   * @returns Извлеченное значение из входных данных.
   */
  const extractProfileErrors = (err: unknown): ProfileFieldErrors | null => {
    if (!err || typeof err !== "object") return null;
    const anyErr = err as ApiError & { response?: { data?: unknown } };
    const data = (anyErr.data ?? anyErr.response?.data) as
      | Record<string, unknown>
      | undefined;
    const rawErrors =
      data && (data.errors as Record<string, unknown> | undefined);
    if (!rawErrors || typeof rawErrors !== "object") return null;

    const normalized: ProfileFieldErrors = {};
    for (const [field, value] of Object.entries(rawErrors)) {
      if (Array.isArray(value)) {
        const messages = value.filter(
          (item) => typeof item === "string",
        ) as string[];
        if (messages.length) normalized[field] = messages;
      } else if (typeof value === "string") {
        normalized[field] = [value];
      }
    }
    return Object.keys(normalized).length ? normalized : null;
  };

  const onNavigate = useCallback(
    (path: string) => {
      navigate(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/register";

  const clearAuthRouteState = useCallback(() => {
    if (!isAuthRoute || (!location.search && !location.state)) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [
    isAuthRoute,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  const handleLogin = useCallback(
    async (identifier: string, password: string) => {
      clearAuthRouteState();
      try {
        const session = await login({ identifier, password });
        if (session.twoFactorRequired) {
          notifications.info("Введите код двухфакторной защиты");
          setLoginTwoFactorOpen(true);
          return;
        }
        notifications.success("Добро пожаловать обратно!");
        onNavigate("/public");
      } catch (err) {
        debugLog("Login failed", err);
        notifications.error(
          extractAuthMessage(err, "Неверный логин или пароль"),
        );
      }
    },
    [clearAuthRouteState, login, notifications, onNavigate],
  );

  const handleConfirmLoginTwoFactor = useCallback(
    async (code: string) => {
      await confirmLoginTwoFactor({ code });
      notifications.success("Добро пожаловать обратно!");
      onNavigate("/public");
    },
    [confirmLoginTwoFactor, notifications, onNavigate],
  );

  const handleRegister = useCallback(
    async (payload: {
      login: string;
      password: string;
      passwordConfirm: string;
      name: string;
      username?: string;
      email?: string;
    }) => {
      clearAuthRouteState();
      try {
        await register({
          ...payload,
          username: payload.username,
          email: payload.email,
        });
        notifications.success("Аккаунт создан. Можно общаться!");
        onNavigate("/public");
      } catch (err) {
        debugLog("Registration failed", err);
        notifications.error(
          extractAuthMessage(err, "Проверьте данные регистрации"),
        );
      }
    },
    [clearAuthRouteState, notifications, onNavigate, register],
  );

  const isGoogleOAuthConfigured = Boolean(
    runtimeConfig.googleOAuthClientId.trim(),
  );
  const googleAuthDisabledReason = isGoogleOAuthConfigured
    ? null
    : "Google OAuth сейчас недоступен. Проверьте конфигурацию сервера.";

  const handleGoogleOAuth = useCallback(() => {
    if (!runtimeConfig.googleOAuthClientId.trim()) {
      return;
    }
    clearAuthRouteState();
    startGoogleAuthRedirect(buildPublicChatPath(), {
      errorReturnTo: `${location.pathname}${location.search}`,
    });
  }, [
    clearAuthRouteState,
    location.pathname,
    location.search,
    runtimeConfig.googleOAuthClientId,
  ]);

  const handleLogout = useCallback(async () => {
    await logout();
    notifications.info("Вы вышли из аккаунта");
    onNavigate("/login");
  }, [logout, notifications, onNavigate]);

  const handleProfileSave = useCallback(
    async (fields: {
      name?: string;
      username?: string;
      image?: File | null;
      avatarCrop?: AvatarCrop | null;
      bio?: string;
    }): Promise<ProfileSaveResult> => {
      if (!auth.user)
        return { ok: false, message: "Сначала войдите в аккаунт." };
      try {
        await updateProfile(fields);
        notifications.success("Профиль обновлен");
        return { ok: true };
      } catch (err) {
        debugLog("Profile update failed", err);
        const apiErr = err as ApiError;

        if (
          apiErr &&
          typeof apiErr.status === "number" &&
          apiErr.status === 401
        ) {
          notifications.error("Сессия истекла. Войдите снова.");
          onNavigate("/login");
          return { ok: false, message: "Сессия истекла. Войдите снова." };
        }

        if (
          apiErr &&
          typeof apiErr.status === "number" &&
          apiErr.status === 413
        ) {
          return {
            ok: false,
            errors: { image: ["Файл слишком большой. Максимум 20 МБ."] },
            message: "Файл слишком большой. Максимум 20 МБ.",
          };
        }

        const fieldErrors = extractProfileErrors(err);
        if (fieldErrors) {
          return { ok: false, errors: fieldErrors };
        }

        return { ok: false, message: extractMessage(err) };
      }
    },
    [auth.user, notifications, onNavigate, updateProfile],
  );

  useEffect(() => {
    if (!isAuthRoute) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauthError");
    if (!oauthError) {
      return;
    }

    const notificationKey = `${location.pathname}:${oauthError}`;
    if (notifiedOauthErrorRef.current !== notificationKey) {
      notifiedOauthErrorRef.current = notificationKey;
      notifications.error(oauthError);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [
    isAuthRoute,
    location.pathname,
    location.search,
    navigate,
    notifications,
  ]);

  const realtimeProvidersReady = !auth.loading && !isAuthRoute;

  const routesElement = (
    <AppRoutes
      user={auth.user}
      passwordRules={passwordRules}
      googleAuthDisabledReason={googleAuthDisabledReason}
      onNavigate={onNavigate}
      onLogin={handleLogin}
      onGoogleOAuth={isGoogleOAuthConfigured ? handleGoogleOAuth : undefined}
      onRegister={handleRegister}
      onLogout={handleLogout}
      onProfileSave={handleProfileSave}
    />
  );

  return (
    <WsAuthProvider token={auth.wsAuthToken}>
      <RoomReadStateProvider>
        <ChatRealtimeProvider ready={realtimeProvidersReady}>
          <PresenceProvider user={auth.user} ready={realtimeProvidersReady}>
            <DirectInboxProvider
              user={auth.user}
              ready={realtimeProvidersReady}
            >
              {isAuthRoute ? (
                <div className={appStyles.authPage}>{routesElement}</div>
              ) : (
                <AppShell user={auth.user} onNavigate={onNavigate}>
                  {routesElement}
                </AppShell>
              )}
              <LoginTwoFactorModal
                open={loginTwoFactorOpen}
                onClose={() => setLoginTwoFactorOpen(false)}
                onConfirm={handleConfirmLoginTwoFactor}
              />
            </DirectInboxProvider>
          </PresenceProvider>
        </ChatRealtimeProvider>
      </RoomReadStateProvider>
    </WsAuthProvider>
  );
}

/**
 * React-компонент AppInner разделяет публичный промо-экран и рабочее приложение.
 */
function AppInner() {
  useViewportCssVars();

  const navigate = useNavigate();
  const location = useLocation();
  const isPromoRoute = location.pathname === "/";

  useEffect(() => {
    const meta = resolveSeoDescriptor(location.pathname);
    const canonicalUrl = new URL(
      location.pathname,
      window.location.origin,
    ).toString();

    document.title = meta.title;
    upsertMetaByName("description", meta.description);
    upsertMetaByName("robots", meta.robots);
    upsertCanonicalLink(canonicalUrl);

    upsertMetaByProperty("og:title", meta.title);
    upsertMetaByProperty("og:description", meta.description);
    upsertMetaByProperty("og:url", canonicalUrl);
    upsertMetaByName("twitter:title", meta.title);
    upsertMetaByName("twitter:description", meta.description);
  }, [location.pathname]);

  const handlePromoNavigate = useCallback(
    (path: string) => {
      navigate(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );
  const handlePromoAuthEntryNavigate =
    useAuthEntryNavigation(handlePromoNavigate);

  return (
    <>
      {isPromoRoute ? (
        <HomePage
          onNavigate={handlePromoNavigate}
          onLoginNavigate={handlePromoAuthEntryNavigate}
        />
      ) : (
        <RuntimeConfigProvider>
          <DeviceProvider>
            <SiteVisitTelemetry />
            <AppWorkspace />
          </DeviceProvider>
        </RuntimeConfigProvider>
      )}
    </>
  );
}

/**
 * React-компонент App отвечает за отрисовку и обработку UI-сценария.
 */
export function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <NotificationProvider>
        <AppInner />
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
