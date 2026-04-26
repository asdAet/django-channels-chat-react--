import { useCallback, useEffect, useMemo, useState } from "react";

import { chatController } from "../../controllers/ChatController";
import type { RoomAttachmentItem } from "../../domain/interfaces/IApiService";
import type { RoomDetails } from "../../entities/room/types";
import {
  isImageAttachment,
  resolveImagePreviewUrl,
} from "../../shared/lib/attachmentMedia";
import { formatLastSeen, formatTimestamp } from "../../shared/lib/format";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { AudioAttachmentPlayer, Avatar, Skeleton } from "../../shared/ui";
import styles from "../../styles/chat/DirectInfoPanel.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  roomId: string;
};

/**
 * Описывает структуру данных `Tab`.
 */
type Tab = "profile" | "attachments";

/**
 * Проверяет условие is video.
 * @param contentType MIME-тип файла.
 */
const isVideo = (contentType: string) => contentType.startsWith("video/");
/**
 * Проверяет условие is audio.
 * @param contentType MIME-тип файла.
 */
const isAudio = (contentType: string) => contentType.startsWith("audio/");

/**
 * Форматирует file size.
 * @param bytes Размер файла в байтах.
 */
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * React-компонент AttachmentCard отвечает за отрисовку и обработку UI-сценария.
 */
function AttachmentCard({ item }: { item: RoomAttachmentItem }) {
  const isImage = isImageAttachment(item.contentType, item.originalFilename);
  const displayName = resolveIdentityLabel(item);
  const imageSrc = resolveImagePreviewUrl({
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    contentType: item.contentType,
    fileName: item.originalFilename,
  });

  const preview = (
    <>
      {isImage && imageSrc && (
        <img
          src={imageSrc}
          alt={item.originalFilename}
          className={styles.media}
        />
      )}

      {isVideo(item.contentType) && item.url && (
        <video
          className={styles.media}
          src={item.url}
          preload="metadata"
          controls
        />
      )}

      {isAudio(item.contentType) && item.url && (
        <div className={styles.fileCard}>
          <AudioAttachmentPlayer
            src={item.url}
            title={item.originalFilename}
            subtitle={formatFileSize(item.fileSize)}
            downloadName={item.originalFilename}
            className={styles.audioPlayer}
          />
        </div>
      )}

      {!isImage &&
        !isVideo(item.contentType) &&
        !isAudio(item.contentType) && (
          <div className={styles.fileCard}>
            <span className={styles.fileIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <span className={styles.fileName}>{item.originalFilename}</span>
            <span className={styles.fileMeta}>
              {formatFileSize(item.fileSize)}
            </span>
          </div>
        )}

      <div className={styles.cardMeta}>
        <span>{displayName}</span>
        <span>{formatTimestamp(item.createdAt)}</span>
      </div>
    </>
  );

  const canOpenAsLink = Boolean(item.url && !isAudio(item.contentType));
  const cardClassName = [
    styles.card,
    isAudio(item.contentType) ? styles.cardAudio : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (canOpenAsLink) {
    return (
      <a
        href={item.url as string}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
      >
        {preview}
      </a>
    );
  }

  return <div className={cardClassName}>{preview}</div>;
}

function DirectInfoProfileSkeleton() {
  return (
    <div className={styles.profile} aria-busy="true">
      <Skeleton variant="circle" width={72} height={72} />
      <Skeleton variant="text" width="46%" height={16} />
      <Skeleton variant="text" width="58%" height={13} />
      <Skeleton height={74} radius={10} />
    </div>
  );
}

function DirectInfoAttachmentsSkeleton() {
  return (
    <div className={styles.grid} aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.card} key={index}>
          <Skeleton height={96} radius={0} />
          <div className={styles.cardMeta}>
            <Skeleton variant="text" width="42%" height={10} />
            <Skeleton variant="text" width="28%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * React-компонент DirectInfoPanel отвечает за отрисовку и обработку UI-сценария.
 */
export function DirectInfoPanel({ roomId }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [attachments, setAttachments] = useState<RoomAttachmentItem[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [room, files] = await Promise.all([
        chatController.getRoomDetails(roomId),
        chatController.getRoomAttachments(roomId, { limit: 60 }),
      ]);
      setDetails(room);
      setAttachments(files.items);
      setHasMore(files.pagination.hasMore);
      setNextBefore(files.pagination.nextBefore);
    } catch {
      setDetails(null);
      setAttachments([]);
      setHasMore(false);
      setNextBefore(null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const files = await chatController.getRoomAttachments(roomId, {
        limit: 60,
        before: nextBefore,
      });
      setAttachments((prev) => [...prev, ...files.items]);
      setHasMore(files.pagination.hasMore);
      setNextBefore(files.pagination.nextBefore);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextBefore, roomId]);

  const peer = details?.peer ?? null;
  const attachmentItems = useMemo(() => attachments, [attachments]);
  const peerDisplayName = peer ? resolveIdentityLabel(peer) : "";

  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, tab === "profile" ? styles.tabActive : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setTab("profile")}
        >
          Профиль
        </button>
        <button
          type="button"
          className={[styles.tab, tab === "attachments" ? styles.tabActive : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setTab("attachments")}
        >
          Вложения
        </button>
      </div>

      {loading && tab === "profile" && <DirectInfoProfileSkeleton />}
      {loading && tab === "attachments" && <DirectInfoAttachmentsSkeleton />}

      {!loading && tab === "profile" && peer && (
        <div className={styles.profile}>
          <Avatar
            username={peerDisplayName}
            profileImage={peer.profileImage}
            avatarCrop={peer.avatarCrop}
            size="default"
          />
          <h4 className={styles.peerName}>{peerDisplayName}</h4>
          <p className={styles.meta}>
            Был(а) в сети: {formatLastSeen(peer.lastSeen ?? null) || "—"}
          </p>
          {peer.bio?.trim() ? (
            <div className={styles.bioSection}>
              <span className={styles.bioLabel}>О себе</span>
              <p className={styles.bioText}>{peer.bio}</p>
            </div>
          ) : null}
        </div>
      )}

      {!loading && tab === "attachments" && (
        <div className={styles.attachments}>
          {attachmentItems.length === 0 && (
            <p className={styles.empty}>В этом чате пока нет вложений.</p>
          )}

          {attachmentItems.length > 0 && (
            <div className={styles.grid}>
              {attachmentItems.map((item) => (
                <AttachmentCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Загрузка..." : "Показать еще"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
