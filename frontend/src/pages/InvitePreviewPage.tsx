import { useCallback, useEffect, useState } from "react";

import { groupController } from "../controllers/GroupController";
import type { InvitePreview } from "../entities/group/types";
import { buildChatTargetPath } from "../shared/lib/chatTarget";
import { Skeleton } from "../shared/ui";
import styles from "../styles/groupWidgets/InvitePreviewPage.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  code: string;
  onNavigate: (path: string) => void;
};

function InvitePreviewSkeleton() {
  return (
    <div className={styles.inviteRoot}>
      <div className={styles.inviteCard} aria-busy="true">
        <Skeleton
          variant="text"
          width="62%"
          height={22}
          className={styles.inviteSkeletonLine}
        />
        <Skeleton
          variant="text"
          width="86%"
          height={14}
          className={styles.inviteSkeletonLine}
        />
        <Skeleton
          variant="text"
          width="46%"
          height={13}
          className={styles.inviteSkeletonLine}
        />
        <Skeleton
          width={180}
          height={42}
          radius={10}
          className={styles.inviteSkeletonButton}
        />
      </div>
    </div>
  );
}

/**
 * React-компонент InvitePreviewPage отвечает за отрисовку и обработку UI-сценария.
 */
export function InvitePreviewPage({ code, onNavigate }: Props) {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    groupController
      .getInvitePreview(code)
      .then(setPreview)
      .catch((err: unknown) => {
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Приглашение не найдено";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const result = await groupController.joinViaInvite(code);
      onNavigate(
        result.groupPublicRef
          ? buildChatTargetPath(result.groupPublicRef)
          : "/groups",
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Не удалось присоединиться";
      setError(msg);
    } finally {
      setJoining(false);
    }
  }, [code, onNavigate]);

  if (loading) {
    return <InvitePreviewSkeleton />;
  }

  if (error && !preview) {
    return (
      <div className={styles.inviteRoot}>
        <div className={styles.inviteCard}>
          <div className={styles.inviteGroupName}>Ошибка</div>
          <div className={styles.inviteGroupDesc}>{error}</div>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className={styles.inviteRoot}>
      <div className={styles.inviteCard}>
        <div className={styles.inviteGroupName}>{preview.groupName}</div>
        {preview.groupDescription && (
          <div className={styles.inviteGroupDesc}>
            {preview.groupDescription}
          </div>
        )}
        <div className={styles.inviteMeta}>
          {preview.memberCount} участников
          {preview.isPublic ? " · Публичная" : " · Закрытая"}
        </div>
        {error && <div className={styles.dialogError}>{error}</div>}
        <button
          type="button"
          className={styles.inviteJoinBtn}
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? "Присоединяемся..." : "Присоединиться"}
        </button>
      </div>
    </div>
  );
}
