import { useCallback, useRef } from "react";

import { authController } from "../controllers/AuthController";
import type { SessionResponseDto } from "../dto";
import { buildPublicChatPath } from "../shared/lib/chatTarget";
import { debugLog } from "../shared/lib/debug";

export const AUTH_ENTRY_LOGIN_PATH = "/login";

export const resolveAuthEntryPath = (
  session: Pick<SessionResponseDto, "authenticated" | "user"> | null,
): string =>
  session?.authenticated && session.user
    ? buildPublicChatPath()
    : AUTH_ENTRY_LOGIN_PATH;

export function useAuthEntryNavigation(onNavigate: (path: string) => void) {
  const pendingSessionCheckRef = useRef<Promise<string> | null>(null);

  const readAuthEntryPath = useCallback((): Promise<string> => {
    if (!pendingSessionCheckRef.current) {
      pendingSessionCheckRef.current = authController
        .getSession()
        .then(resolveAuthEntryPath)
        .catch((err: unknown) => {
          debugLog("Promo auth session check failed", err);
          return AUTH_ENTRY_LOGIN_PATH;
        })
        .finally(() => {
          pendingSessionCheckRef.current = null;
        });
    }

    return pendingSessionCheckRef.current;
  }, []);

  return useCallback(() => {
    void readAuthEntryPath().then(onNavigate);
  }, [onNavigate, readAuthEntryPath]);
}
