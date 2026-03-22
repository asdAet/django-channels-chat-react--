import { useNavigate } from "react-router-dom";

import { useInfoPanel } from "../../shared/layout/useInfoPanel";
import { buildChatTargetPath } from "../../shared/lib/chatTarget";
import styles from "../../styles/layout/InfoPanel.module.css";
import { ChatSearch } from "../chat/ChatSearch";
import { DirectInfoPanel } from "../chat/DirectInfoPanel";
import { UserProfilePanel } from "../chat/UserProfilePanel";
import { GroupInfoPanel } from "../groups/GroupInfoPanel";

const TITLES: Record<string, string> = {
  profile: "Профиль",
  group: "Информация",
  search: "Поиск",
  direct: "Контакт и вложения",
};

/**
 * Компонент PanelContent рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
function PanelContent({
  content,
  targetId,
  currentPublicRef,
  onJumpToMessage,
}: {
  content: string;
  targetId: string | null;
  currentPublicRef: string | null;
  onJumpToMessage: (roomTarget: string, messageId: number) => void;
}) {
  if (content === "search" && targetId) {
    return (
      <ChatSearch
        roomId={targetId}
        onResultClick={(messageId) => onJumpToMessage(targetId, messageId)}
      />
    );
  }

  if (content === "group" && targetId) {
    return <GroupInfoPanel roomId={targetId} />;
  }

  if (content === "direct" && targetId) {
    return <DirectInfoPanel roomId={targetId} />;
  }

  if (content === "profile" && targetId) {
    return (
      <UserProfilePanel
        publicRef={targetId}
        currentPublicRef={currentPublicRef}
      />
    );
  }

  return (
    <div className={styles.placeholder}>
      <p>Выберите контент для отображения</p>
    </div>
  );
}

/**
 * Компонент InfoPanel рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function InfoPanel({
  currentPublicRef,
}: {
  currentPublicRef: string | null;
}) {
  const { isOpen, content, targetId, close, clearClosed } = useInfoPanel();
  const navigate = useNavigate();

  /**
   * Обрабатывает on jump to message.
   * @param roomTarget External room target used to build the chat route.
   * @param messageId Идентификатор сообщения.
   */
  const onJumpToMessage = (roomTarget: string, messageId: number) => {
    navigate(`${buildChatTargetPath(roomTarget)}?message=${messageId}`);
  };

  if (!content) return null;

  /**
   * Обрабатывает handle panel transition end.
   * @param event Событие браузера.
   */
  const handlePanelTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {
    if (event.currentTarget !== event.target) return;
    if (isOpen) return;
    clearClosed();
  };

  const compactHeader = content === "group";

  return (
    <>
      <div
        className={[styles.overlay, !isOpen ? styles.overlayHidden : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={[styles.panel, !isOpen ? styles.panelHidden : ""]
          .filter(Boolean)
          .join(" ")}
        aria-label="Информационная панель"
        onTransitionEnd={handlePanelTransitionEnd}
      >
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            {TITLES[content] ?? "Информация"}
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label="Закрыть панель"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div
          className={[styles.body, compactHeader ? styles.bodyCompact : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <PanelContent
            content={content}
            targetId={targetId}
            currentPublicRef={currentPublicRef}
            onJumpToMessage={onJumpToMessage}
          />
        </div>
      </aside>
    </>
  );
}
