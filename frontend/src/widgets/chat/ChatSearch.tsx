import { useCallback, useEffect, useRef, useState } from "react";

import { chatController } from "../../controllers/ChatController";
import type { SearchResultItem } from "../../domain/interfaces/IApiService";
import { formatTimestamp } from "../../shared/lib/format";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import { Skeleton } from "../../shared/ui";
import styles from "../../styles/chat/ChatSearch.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  roomId: string;
  onResultClick?: (messageId: number) => void;
};

/**
 * Обрабатывает highlight text.
 * @param text Текст, который используется в вычислении.
 * @param query Поисковый запрос.

 */
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

/**
 * Skeleton результатов поиска сообщений. Поле ввода остается доступным, а
 * изменяемая зона результатов показывает прогресс без скачка layout.
 */
function ChatSearchResultsSkeleton() {
  return (
    <div className={styles.searchSkeleton} aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.resultItem} key={index}>
          <div className={styles.resultSkeletonMeta}>
            <Skeleton variant="text" width="24%" height={11} />
            <Skeleton variant="text" width="18%" height={10} />
          </div>
          <Skeleton variant="text" width={index % 2 === 0 ? "78%" : "62%"} />
        </div>
      ))}
    </div>
  );
}

/**
 * React-компонент ChatSearch отвечает за отрисовку и обработку UI-сценария.
 */
export function ChatSearch({ roomId, onResultClick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const result = await chatController.searchMessages(roomId, q);
        setResults(result.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [roomId],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск сообщений..."
          autoFocus
        />
      </div>

      <div className={styles.results}>
        {loading && (
          <ChatSearchResultsSkeleton />
        )}

        {!loading && searched && results.length === 0 && (
          <div className={styles.centered}>Ничего не найдено</div>
        )}

        {!loading &&
          results.map((r) => {
            const displayName = resolveIdentityLabel(r);
            return (
              <div
                key={r.id}
                className={styles.resultItem}
                onClick={() => onResultClick?.(r.id)}
                role="button"
                tabIndex={0}
              >
                <span className={styles.resultUser}>{displayName}</span>
                <span className={styles.resultTime}>
                  {formatTimestamp(r.createdAt)}
                </span>
                <div
                  className={styles.resultContent}
                  dangerouslySetInnerHTML={{
                    __html: r.highlight || highlightText(r.content, query),
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}
