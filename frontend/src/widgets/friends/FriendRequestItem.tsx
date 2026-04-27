import type { FriendRequest } from "../../entities/friend/types";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/friends/FriendRequestItem.module.css";

/**
 * Описывает входные props компонента `Incoming`.
 */
type IncomingProps = {
  request: FriendRequest;
  direction: "incoming";
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
};

/**
 * Описывает входные props компонента `Outgoing`.
 */
type OutgoingProps = {
  request: FriendRequest;
  direction: "outgoing";
  onCancel: (id: number) => void;
};

/**
 * Описывает входные props компонента `Props`.
 */
type Props = IncomingProps | OutgoingProps;

/**
 * React-компонент FriendRequestItem отвечает за отрисовку и обработку UI-сценария.
 * @param props Свойства компонента или хука.
 */
export function FriendRequestItem(props: Props) {
  const { request, direction } = props;
  const displayName = resolveIdentityLabel(request);

  return (
    <div className={styles.item}>
      <Avatar
        username={displayName}
        profileImage={request.profileImage ?? null}
        avatarCrop={request.avatarCrop ?? undefined}
        size="small"
        online={false}
        loading="eager"
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
