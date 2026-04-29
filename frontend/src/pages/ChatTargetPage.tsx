import { useEffect, useMemo, useState } from "react";

import { chatController } from "../controllers/ChatController";
import type { UserProfile } from "../entities/user/types";
import type { ApiError } from "../shared/api/types";
import { normalizeChatTarget } from "../shared/lib/chatTarget";
import { debugLog } from "../shared/lib/debug";
import { rememberLastDirectRef } from "../shared/lib/directNavigation";
import { Button, PageState, type PageStateTone } from "../shared/ui";
import { ChatRoomPage } from "./ChatRoomPage";
import { ChatRoomLoadingShell } from "./chatRoomPage/ChatRoomLoadingState";

type Props = {
  user: UserProfile | null;
  target: string;
  onNavigate: (path: string) => void;
};

type ChatTargetErrorKind =
  | "not_found"
  | "invalid"
  | "auth"
  | "forbidden"
  | "unavailable";

type ChatTargetState = {
  key: string;
  roomId: string | null;
  roomKind: "public" | "private" | "direct" | "group" | null;
  errorKind: ChatTargetErrorKind | null;
};

type ChatTargetErrorMeta = {
  tone: PageStateTone;
  eyebrow: string;
  title: string;
  description: string;
};

const ChatTargetStateIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4.75 5.5h14.5v9.25H10L5.25 19v-4.25h-.5V5.5Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M9 9h6M9 12h3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

const getChatTargetErrorMeta = (
  errorKind: ChatTargetErrorKind,
): ChatTargetErrorMeta => {
  if (errorKind === "not_found") {
    return {
      tone: "warning",
      eyebrow: "Не найдено",
      title: "Чат не найден",
      description:
        "Такого чата нет, ссылка устарела или адрес был введен с ошибкой.",
    };
  }

  if (errorKind === "invalid") {
    return {
      tone: "warning",
      eyebrow: "Неверный адрес",
      title: "Нельзя открыть чат с этим адресом",
      description: "Проверьте ссылку или выберите чат из списка контактов.",
    };
  }

  if (errorKind === "auth") {
    return {
      tone: "info",
      eyebrow: "Нужен вход",
      title: "Нужна авторизация",
      description: "Войдите в аккаунт, чтобы открыть этот чат.",
    };
  }

  if (errorKind === "forbidden") {
    return {
      tone: "danger",
      eyebrow: "Нет доступа",
      title: "Доступ запрещен",
      description: "У вас нет прав на просмотр этого чата.",
    };
  }

  return {
    tone: "danger",
    eyebrow: "Недоступно",
    title: "Чат недоступен",
    description:
      "Не удалось открыть чат. Попробуйте позже или вернитесь в общий чат.",
  };
};

/**
 * Открывает чат по внешнему `target`, предварительно разрешая его в `roomId`.
 */
export function ChatTargetPage({ user, target, onNavigate }: Props) {
  const normalizedTarget = useMemo(() => normalizeChatTarget(target), [target]);
  const requestKey = useMemo(
    () =>
      user
        ? `${user.username}:${normalizedTarget}`
        : `guest:${normalizedTarget}`,
    [normalizedTarget, user],
  );

  const [state, setState] = useState<ChatTargetState>(() => ({
    key: "initial",
    roomId: null,
    roomKind: null,
    errorKind: null,
  }));

  useEffect(() => {
    let active = true;

    chatController
      .resolveChatTarget(normalizedTarget)
      .then((payload) => {
        if (!active) return;

        if (payload.targetKind === "direct") {
          rememberLastDirectRef(
            payload.peer?.publicRef || payload.resolvedTarget,
          );
        }

        setState({
          key: requestKey,
          roomId: String(payload.roomId),
          roomKind: payload.roomKind,
          errorKind: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        debugLog("Chat target resolve failed", err);
        const apiErr = err as ApiError;

        let errorKind: ChatTargetErrorKind = "unavailable";
        if (apiErr.status === 404) errorKind = "not_found";
        if (apiErr.status === 400) errorKind = "invalid";
        if (apiErr.status === 401) errorKind = "auth";
        if (apiErr.status === 403) errorKind = "forbidden";

        setState({
          key: requestKey,
          roomId: null,
          roomKind: null,
          errorKind,
        });
      });

    return () => {
      active = false;
    };
  }, [normalizedTarget, requestKey]);

  const isCurrent = state.key === requestKey;
  const loading = !isCurrent;
  const errorKind = isCurrent ? state.errorKind : null;
  const roomId = isCurrent ? state.roomId : null;
  const roomKind = isCurrent ? state.roomKind : null;
  const headerActionSlots = normalizedTarget === "public" ? 1 : 2;
  const canOfferFriends = normalizedTarget !== "public";

  if (loading) {
    return (
      <ChatRoomLoadingShell
        showComposer={Boolean(user)}
        headerActionSlots={headerActionSlots}
      />
    );
  }

  if (errorKind) {
    const meta = getChatTargetErrorMeta(errorKind);

    return (
      <PageState
        tone={meta.tone}
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        icon={<ChatTargetStateIcon />}
      >
        {errorKind === "auth" ? (
          <Button variant="primary" onClick={() => onNavigate("/login")}>
            Войти
          </Button>
        ) : null}
        {canOfferFriends ? (
          <Button variant="ghost" onClick={() => onNavigate("/friends")}>
            К друзьям
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => onNavigate("/public")}>
          В публичный чат
        </Button>
      </PageState>
    );
  }

  if (!roomId) {
    const meta = getChatTargetErrorMeta("unavailable");

    return (
      <PageState
        tone={meta.tone}
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        icon={<ChatTargetStateIcon />}
      >
        <Button variant="outline" onClick={() => onNavigate("/public")}>
          В публичный чат
        </Button>
      </PageState>
    );
  }

  return (
    <ChatRoomPage
      roomId={roomId}
      initialRoomKind={roomKind}
      user={user}
      onNavigate={onNavigate}
    />
  );
}
