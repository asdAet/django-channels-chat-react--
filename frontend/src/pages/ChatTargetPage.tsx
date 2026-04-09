import { useEffect, useMemo, useState } from "react";

import { chatController } from "../controllers/ChatController";
import type { UserProfile } from "../entities/user/types";
import type { ApiError } from "../shared/api/types";
import { normalizeChatTarget } from "../shared/lib/chatTarget";
import { debugLog } from "../shared/lib/debug";
import { rememberLastDirectRef } from "../shared/lib/directNavigation";
import { Button, Panel } from "../shared/ui";
import styles from "../styles/pages/ChatTargetPage.module.css";
import { ChatRoomPage } from "./ChatRoomPage";

type Props = {
  user: UserProfile | null;
  target: string;
  onNavigate: (path: string) => void;
};

type ChatTargetState = {
  key: string;
  roomId: string | null;
  roomKind: "public" | "private" | "direct" | "group" | null;
  error: string | null;
};

/**
 * Открывает чат по внешнему `target`, предварительно разрешая его в `roomId`.
 *
 * Страница нужна как мост между канонической внешней навигацией по public target
 * и внутренним room-id transport: сначала дергает `resolveChatTarget`, а затем
 * либо показывает `ChatRoomPage`, либо выводит понятную ошибку доступа.
 */
export function ChatTargetPage({ user, target, onNavigate }: Props) {
  const normalizedTarget = useMemo(() => normalizeChatTarget(target), [target]);
  const requestKey = useMemo(
    () => (user ? `${user.username}:${normalizedTarget}` : `guest:${normalizedTarget}`),
    [normalizedTarget, user],
  );

  const [state, setState] = useState<ChatTargetState>(() => ({
    key: "initial",
    roomId: null,
    roomKind: null,
    error: null,
  }));

  useEffect(() => {
    let active = true;

    chatController
      .resolveChatTarget(normalizedTarget)
      .then((payload) => {
        if (!active) return;

        if (payload.targetKind === "direct") {
          rememberLastDirectRef(payload.peer?.publicRef || payload.resolvedTarget);
        }

        setState({
          key: requestKey,
          roomId: String(payload.roomId),
          roomKind: payload.roomKind,
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        debugLog("Chat target resolve failed", err);
        const apiErr = err as ApiError;

        if (apiErr.status === 404) {
          setState({
            key: requestKey,
            roomId: null,
            roomKind: null,
            error: "Чат не найден",
          });
          return;
        }
        if (apiErr.status === 400) {
          setState({
            key: requestKey,
            roomId: null,
            roomKind: null,
            error: "Нельзя открыть чат с этим адресом",
          });
          return;
        }
        if (apiErr.status === 401) {
          setState({
            key: requestKey,
            roomId: null,
            roomKind: null,
            error: "Нужна авторизация",
          });
          return;
        }
        if (apiErr.status === 403) {
          setState({
            key: requestKey,
            roomId: null,
            roomKind: null,
            error: "Доступ запрещен",
          });
          return;
        }

        setState({
          key: requestKey,
          roomId: null,
          roomKind: null,
          error: "Не удалось открыть чат",
        });
      });

    return () => {
      active = false;
    };
  }, [normalizedTarget, requestKey]);

  const isCurrent = state.key === requestKey;
  const loading = !isCurrent;
  const error = isCurrent ? state.error : null;
  const roomId = isCurrent ? state.roomId : null;
  const roomKind = isCurrent ? state.roomKind : null;

  if (loading) {
    return <Panel muted busy>Открываем чат...</Panel>;
  }

  if (error) {
    return (
      <Panel>
        <p>{error}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => onNavigate("/friends")}>
            К друзьям
          </Button>
        </div>
      </Panel>
    );
  }

  if (!roomId) {
    return (
      <Panel>
        <p>Чат недоступен.</p>
      </Panel>
    );
  }

  return <ChatRoomPage roomId={roomId} initialRoomKind={roomKind} user={user} onNavigate={onNavigate} />;
}
