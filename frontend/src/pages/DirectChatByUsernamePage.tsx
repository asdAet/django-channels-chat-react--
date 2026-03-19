import { useEffect, useMemo, useState } from "react";

import { chatController } from "../controllers/ChatController";
import type { UserProfile } from "../entities/user/types";
import type { ApiError } from "../shared/api/types";
import { debugLog } from "../shared/lib/debug";
import { Button, Panel } from "../shared/ui";
import styles from "../styles/pages/DirectChatByUsernamePage.module.css";
import { ChatRoomPage } from "./ChatRoomPage";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  publicRef: string;
  onNavigate: (path: string) => void;
};

/**
 * Описывает структуру состояния `DirectChat`.
 */
type DirectChatState = {
  key: string;
  roomRef: string | null;
  error: string | null;
};

/**
 * React-компонент DirectChatByUsernamePage отвечает за отрисовку и обработку UI-сценария.
 */
export function DirectChatByUsernamePage({ user, publicRef, onNavigate }: Props) {
  const requestKey = useMemo(
    () => (user ? `${user.username}:${publicRef}` : "guest"),
    [publicRef, user],
  );

  const [state, setState] = useState<DirectChatState>(() => ({
    key: "guest",
    roomRef: null,
    error: null,
  }));

  useEffect(() => {
    if (!user) return;
    let active = true;

    chatController
      .startDirectChat(publicRef)
      .then((payload) => {
        if (!active) return;
        setState({
          key: requestKey,
          roomRef: String(payload.roomId),
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        debugLog("Direct start failed", err);
        const apiErr = err as ApiError;

        if (apiErr.status === 404) {
          setState({
            key: requestKey,
            roomRef: null,
            error: "Пользователь не найден",
          });
          return;
        }
        if (apiErr.status === 400) {
          setState({
            key: requestKey,
            roomRef: null,
            error: "Нельзя открыть диалог с этим пользователем",
          });
          return;
        }
        if (apiErr.status === 401) {
          setState({
            key: requestKey,
            roomRef: null,
            error: "Нужна авторизация",
          });
          return;
        }

        setState({
          key: requestKey,
          roomRef: null,
          error: "Не удалось открыть личный чат",
        });
      });

    return () => {
      active = false;
    };
  }, [publicRef, requestKey, user]);

  if (!user) {
    return (
      <Panel>
        <p>Чтобы писать в личные сообщения, войдите в аккаунт.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => onNavigate("/login")}>
            Войти
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("/register")}>
            Регистрация
          </Button>
        </div>
      </Panel>
    );
  }

  const isCurrent = state.key === requestKey;
  const loading = !isCurrent;
  const error = isCurrent ? state.error : null;
  const roomRef = isCurrent ? state.roomRef : null;

  if (loading) {
    return (
      <Panel muted busy>
        Открываем диалог...
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <p>{error}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => onNavigate("/direct")}>
            К списку диалогов
          </Button>
        </div>
      </Panel>
    );
  }

  if (!roomRef) {
    return (
      <Panel>
        <p>Диалог недоступен.</p>
      </Panel>
    );
  }

  return <ChatRoomPage slug={roomRef} user={user} onNavigate={onNavigate} />;
}
