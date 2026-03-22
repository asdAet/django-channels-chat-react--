import { buildDirectChatPath, normalizeChatTarget, parseChatTargetFromPathname } from "./chatTarget";
import { formatPublicRef } from "./publicRef";

export const LAST_DIRECT_REF_STORAGE_KEY = "ui.direct.last-ref";
export const DIRECT_HOME_FALLBACK_PATH = "/friends";

export const readStoredLastDirectRef = (): string => {
  if (typeof window === "undefined") return "";
  return formatPublicRef(window.localStorage.getItem(LAST_DIRECT_REF_STORAGE_KEY) || "");
};

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
