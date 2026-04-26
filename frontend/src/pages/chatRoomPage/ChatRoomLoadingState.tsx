import type { CSSProperties } from "react";

import { Skeleton } from "../../shared/ui";
import styles from "../../styles/pages/ChatRoomLoadingState.module.css";

const MESSAGE_ROWS = [
  { width: "58%", lines: ["72%", "38%"], own: false },
  { width: "46%", lines: ["64%"], own: true },
  { width: "64%", lines: ["84%", "52%"], own: false },
  { width: "52%", lines: ["72%"], own: true },
] as const;

/**
 * Свойства skeleton-истории сообщений.
 */
type ChatHistorySkeletonProps = {
  /**
   * Сокращенный вариант для догрузки старых сообщений над уже видимой историей.
   */
  compact?: boolean;
};

/**
 * Свойства skeleton-композера сообщения.
 */
type ChatComposerSkeletonProps = {
  /**
   * Компактный режим без собственной подложки для встраивания в локальные зоны.
   */
  compact?: boolean;
};

/**
 * Свойства полного загрузочного каркаса страницы чата.
 */
type ChatRoomLoadingShellProps = {
  /**
   * Показывать ли нижний composer-placeholder. Для гостевого публичного чата он
   * не нужен, потому что после загрузки гостю доступен только read-only callout.
   */
  showComposer?: boolean;
  /**
   * Количество действий справа в header. Оно резервирует ровно столько места,
   * сколько будет занимать настоящий header после загрузки комнаты.
   */
  headerActionSlots?: 1 | 2;
};

/**
 * Приводит набор CSS custom properties к типу React style.
 */
const skeletonVars = (vars: Record<string, string>): CSSProperties =>
  vars as CSSProperties;

/**
 * Показывает skeleton-ленту сообщений без демонтажа контейнера прокрутки.
 */
export function ChatHistorySkeleton({
  compact = false,
}: ChatHistorySkeletonProps) {
  const rows = compact ? MESSAGE_ROWS.slice(0, 2) : MESSAGE_ROWS;

  return (
    <div
      className={[
        styles.historySkeleton,
        compact ? styles.historySkeletonCompact : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label="История сообщений загружается"
    >
      {rows.map((row, index) => (
        <div
          key={`${row.width}-${index}`}
          className={[
            styles.historySkeletonRow,
            row.own ? styles.historySkeletonRowOwn : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={skeletonVars({ "--skeleton-row-width": row.width })}
        >
          {!row.own && <Skeleton variant="circle" width={34} height={34} />}
          <div className={styles.historySkeletonBubble}>
            {row.lines.map((lineWidth, lineIndex) => (
              <Skeleton
                key={`${lineWidth}-${lineIndex}`}
                variant="text"
                width={lineWidth}
                height={lineIndex === 0 ? 12 : 10}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Показывает placeholder нижней панели ввода во время первичной загрузки чата.
 */
export function ChatComposerSkeleton({
  compact = false,
}: ChatComposerSkeletonProps) {
  return (
    <div
      className={[
        styles.composerSkeleton,
        compact ? styles.composerSkeletonCompact : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <Skeleton variant="circle" width={44} height={44} />
      <Skeleton variant="circle" width={44} height={44} />
      <Skeleton className={styles.composerSkeletonInput} height={44} />
      <Skeleton variant="circle" width={44} height={44} />
    </div>
  );
}

/**
 * Рендерит полный каркас чата на этапе resolve target, когда roomId еще не
 * известен и полноценный `ChatRoomPage` нельзя безопасно смонтировать.
 */
export function ChatRoomLoadingShell({
  showComposer = true,
  headerActionSlots = 2,
}: ChatRoomLoadingShellProps) {
  return (
    <div
      className={styles.chat}
      data-testid="chat-loading-shell"
      aria-busy="true"
    >
      <div className={styles.chatHeader}>
        <div className={styles.directHeader}>
          <div className={styles.mobileHeaderButtons} aria-hidden="true">
            <Skeleton variant="circle" width={44} height={44} />
          </div>
          <Skeleton variant="circle" width={45} height={45} />
          <div className={styles.loadingHeaderMeta}>
            <Skeleton variant="text" width="38%" height={14} />
            <Skeleton variant="text" width="24%" height={11} />
          </div>
          <div className={styles.directHeaderActions}>
            {Array.from({ length: headerActionSlots }, (_, index) => (
              <Skeleton key={index} width={44} height={44} radius={8} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chatBox}>
        <div className={[styles.chatLog, styles.chatLogLoading].join(" ")}>
          <ChatHistorySkeleton />
        </div>
        {showComposer && <ChatComposerSkeleton />}
      </div>
    </div>
  );
}
