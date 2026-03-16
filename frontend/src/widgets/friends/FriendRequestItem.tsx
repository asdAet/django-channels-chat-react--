import type { FriendRequest } from "../../entities/friend/types";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/friends/FriendsPage.module.css";

type IncomingProps = {
  request: FriendRequest;
  direction: "incoming";
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
};

type OutgoingProps = {
  request: FriendRequest;
  direction: "outgoing";
  onCancel: (id: number) => void;
};

type Props = IncomingProps | OutgoingProps;

export function FriendRequestItem(props: Props) {
  const { request, direction } = props;
  const displayName = request.displayName ?? request.username;

  return (
    <div className={styles.item}>
      <Avatar
        username={displayName}
        profileImage={request.profileImage ?? null}
        avatarCrop={request.avatarCrop ?? undefined}
        size="small"
        online={false}
      />
      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{displayName}</div>
        <div className={styles.itemMeta}>
          {direction === "incoming"
            ? "Хочет добавить вас"
            : "Ожидает подтверждения"}
        </div>
      </div>
      <div className={styles.itemActions}>
        {direction === "incoming" && (
          <button
            type="button"
            className={[styles.actionBtn, styles.actionBtnAccept].join(" ")}
            onClick={() => (props as IncomingProps).onAccept(request.id)}
          >
            Принять
          </button>
        )}
        <button
          type="button"
          className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
          onClick={() => {
            if (direction === "incoming") {
              props.onDecline(request.id);
              return;
            }
            props.onCancel(request.id);
          }}
        >
          {direction === "incoming" ? "Отклонить" : "Отменить"}
        </button>
      </div>
    </div>
  );
}
