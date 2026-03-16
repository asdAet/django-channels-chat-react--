import type { Friend } from "../../entities/friend/types";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/friends/FriendsPage.module.css";

type Props = {
  friend: Friend;
  isOnline: boolean;
  onMessage: (publicRef: string) => void;
  onRemove: (userId: number) => void;
  onBlock: (publicRef: string) => void;
};

export function FriendListItem({
  friend,
  isOnline,
  onMessage,
  onRemove,
  onBlock,
}: Props) {
  const peerRef = friend.publicRef;
  const displayName = friend.displayName ?? friend.username;

  return (
    <div className={styles.item}>
      <Avatar
        username={displayName}
        profileImage={friend.profileImage}
        avatarCrop={friend.avatarCrop ?? undefined}
        size="small"
        online={isOnline}
      />
      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{displayName}</div>
        <div className={styles.itemMeta}>
          {isOnline ? "В сети" : "Не в сети"}
        </div>
      </div>
      <div className={styles.itemActions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => onMessage(peerRef)}
        >
          Написать
        </button>
        <button
          type="button"
          className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
          onClick={() => onRemove(friend.userId)}
        >
          Удалить
        </button>
        <button
          type="button"
          className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
          onClick={() => onBlock(peerRef)}
        >
          Блок
        </button>
      </div>
    </div>
  );
}
