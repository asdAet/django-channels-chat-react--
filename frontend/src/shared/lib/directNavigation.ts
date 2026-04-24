import { buildDirectChatPath, normalizeChatTarget, parseChatTargetFromPathname } from "./chatTarget";
import { formatPublicRef } from "./publicRef";

/**
 * Ключ localStorage, под которым хранится последний открытый личный диалог.
 */
export const LAST_DIRECT_REF_STORAGE_KEY = "ui.direct.last-ref";
/**
 * Безопасный маршрут по умолчанию, если восстановить последнее ЛС не удалось.
 */
export const DIRECT_HOME_FALLBACK_PATH = "/friends";

/**
 * Читает из localStorage публичный ref последнего открытого личного чата.
 *
 * Возвращает уже нормализованное значение с префиксом public ref или пустую
 * строку, если в хранилище нет корректных данных.
 */
export const readStoredLastDirectRef = (): string => {
  if (typeof window === "undefined") return "";
  return formatPublicRef(window.localStorage.getItem(LAST_DIRECT_REF_STORAGE_KEY) || "");
};

/**
 * Запоминает публичный ref собеседника, чтобы можно было быстро вернуться в ЛС.
 *
 * Пустые и некорректные значения игнорируются, чтобы не засорять хранилище
 * мусорными ключами и не ломать последующее восстановление навигации.
 */
export const rememberLastDirectRef = (value: string | null | undefined): void => {
  if (typeof window === "undefined") return;
  const normalized = formatPublicRef(value || "");
  if (!normalized) return;
  window.localStorage.setItem(LAST_DIRECT_REF_STORAGE_KEY, normalized);
};

type ResolveRememberedDirectPathOptions = {
  pathname?: string;
  fallbackPath?: string;
  directPeerRefs?: Array<string | null | undefined>;
};

/**
 * Вычисляет маршрут, в который нужно вести пользователя из shortcut-а личных чатов.
 *
 * Приоритет такой: активный подходящий direct route, сохраненный в localStorage
 * peer ref, первый доступный peer ref из списка и только потом fallback path.
 */
export const resolveRememberedDirectPath = ({
  pathname,
  fallbackPath = DIRECT_HOME_FALLBACK_PATH,
  directPeerRefs = [],
}: ResolveRememberedDirectPathOptions = {}): string => {
  const knownRefs = new Set(
    directPeerRefs
      .map((peerRef) => formatPublicRef(peerRef || ""))
      .filter(Boolean),
  );

  const activeTarget = pathname ? parseChatTargetFromPathname(pathname) : null;
  if (activeTarget && knownRefs.has(activeTarget)) {
    return buildDirectChatPath(activeTarget);
  }

  const storedDirectRef = readStoredLastDirectRef();
  if (storedDirectRef) return buildDirectChatPath(storedDirectRef);

  for (const peerRef of directPeerRefs) {
    const normalized = normalizeChatTarget(peerRef);
    if (normalized) return buildDirectChatPath(normalized);
  }

  return fallbackPath;
};
