import type { GroupListItem as GroupListItemType } from "../../entities/group/types";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/groups/GroupsPage.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  group: GroupListItemType;
  onClick: (roomTarget: string) => void;
};

/**
 * React-компонент GroupListItem отвечает за отрисовку и обработку UI-сценария.
 */
export function GroupListItem({ group, onClick }: Props) {
  return (
    <div
      className={styles.item}
      onClick={() => onClick(group.roomTarget)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.itemIcon}>
        <Avatar
          username={group.name}
          profileImage={group.avatarUrl ?? null}
          avatarCrop={group.avatarCrop ?? undefined}
          size="small"
        />
      </div>
      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{group.name}</div>
        {group.description && (
          <div className={styles.itemDesc}>{group.description}</div>
        )}
      </div>
      <div className={styles.itemMeta}>{group.memberCount} уч.</div>
    </div>
  );
}
