import type { GroupMember } from "../../entities/group/types";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { Avatar } from "../../shared/ui";
import styles from "../../styles/groups/GroupMembersList.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  members: GroupMember[];
  isAdmin: boolean;
  onKick?: (userId: number) => void;
  onBan?: (userId: number) => void;
  onMute?: (userId: number) => void;
  onUnmute?: (userId: number) => void;
};

/**
 * Компонент GroupMembersList рендерит список участников и их базовые действия.
 */
export function GroupMembersList({
  members,
  isAdmin,
  onKick,
  onBan,
  onMute,
  onUnmute,
}: Props) {
  return (
    <>
      {members.map((member) => {
        const isSelf = member.isSelf === true;
        const displayName = resolveIdentityLabel(member);

        return (
          <div key={member.userId} className={styles.item}>
            <Avatar
              username={displayName}
              profileImage={member.profileImage ?? null}
              avatarCrop={member.avatarCrop ?? undefined}
              size="small"
              online={false}
            />
            <div className={styles.itemInfo}>
              <div className={styles.itemName}>
                {displayName}
                {member.roles.map((role) => (
                  <span key={role} className={styles.memberRoleBadge}>
                    {role}
                  </span>
                ))}
                {member.isMuted && <span className={styles.mutedTag}>muted</span>}
              </div>
              <div className={styles.itemDesc}>
                {member.nickname ||
                  `Участник с ${new Date(member.joinedAt).toLocaleDateString()}`}
              </div>
            </div>
            {isAdmin && !isSelf && (
              <div className={styles.itemActions}>
                {member.isMuted ? (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onUnmute?.(member.userId)}
                  >
                    Включить звук
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onMute?.(member.userId)}
                  >
                    Заглушить
                  </button>
                )}
                <button
                  type="button"
                  className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
                  onClick={() => onKick?.(member.userId)}
                >
                  Кик
                </button>
                <button
                  type="button"
                  className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
                  onClick={() => onBan?.(member.userId)}
                >
                  Бан
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}