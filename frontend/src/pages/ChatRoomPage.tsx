import type { ChatRoomPageProps } from "./ChatRoomPage.types";
import { ChatRoomPageView } from "./chatRoomPage/ChatRoomPageView";
import { useChatRoomPageController } from "./chatRoomPage/useChatRoomPageController";

/**
 * Внутренний контейнер одной сессии комнаты.
 *
 * @param props Входные параметры маршрута и текущего пользователя.
 * @returns Подготовленный экземпляр страницы комнаты.
 */
function ChatRoomPageSession({
  roomId,
  initialRoomKind = null,
  user,
  onNavigate,
}: ChatRoomPageProps) {
  const controller = useChatRoomPageController({
    roomId,
    initialRoomKind,
    user,
  });

  return (
    <ChatRoomPageView
      controller={controller}
      onNavigate={onNavigate}
      user={user}
    />
  );
}

/**
 * Точка входа страницы комнаты чата.
 *
 * @param props Входные параметры маршрута и текущего пользователя.
 * @returns Страница комнаты с изолированным ключом сессии.
 */
export function ChatRoomPage(props: ChatRoomPageProps) {
  const sessionKey = [
    props.roomId,
    props.initialRoomKind ?? "unknown",
    props.user?.publicRef ?? props.user?.username ?? "guest",
  ].join(":");

  return <ChatRoomPageSession key={sessionKey} {...props} />;
}
