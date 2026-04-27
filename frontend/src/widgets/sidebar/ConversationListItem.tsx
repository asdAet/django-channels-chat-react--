import type { ConversationItem } from "../../entities/conversation/types";
import { formatTimestamp } from "../../shared/lib/format";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/sidebar/ConversationListItem.module.css";

const EMPTY_PREVIEW = String.fromCharCode(160);

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  item: ConversationItem;
  isActive: boolean;
  onClick: () => void;
};

/**
 * React-компонент ConversationListItem отвечает за отрисовку и обработку UI-сценария.
 */
export function ConversationListItem({ item, isActive, onClick }: Props) {
  return (
    <button
      type="button"
      className={[styles.item, isActive ? styles.active : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      <Avatar
        username={item.name}
        profileImage={item.avatarUrl}
        avatarCrop={item.avatarCrop}
        size="tiny"
        online={item.isOnline}
      />
      <div className={styles.itemBody}>
        <div className={styles.itemTop}>
          <div className={styles.itemNameWrap}>
            <span className={styles.itemName}>{item.name}</span>
            {item.isPinned && <span className={styles.pinnedMark}>PIN</span>}
          </div>
          {item.lastMessageAt && (
            <span className={styles.itemTime}>
              {formatTimestamp(item.lastMessageAt)}
            </span>
          )}
        </div>
        <div className={styles.itemBottom}>
          <p className={styles.itemPreview}>{item.lastMessage || EMPTY_PREVIEW}</p>
          {item.unreadCount > 0 && (
            <span className={styles.badge}>{item.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}
