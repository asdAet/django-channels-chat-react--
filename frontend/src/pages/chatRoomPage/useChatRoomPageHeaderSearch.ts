import { useCallback, useEffect, useRef, useState } from "react";

import { chatController } from "../../controllers/ChatController";
import type {
  UseChatRoomPageHeaderSearchOptions,
  UseChatRoomPageHeaderSearchResult,
} from "./useChatRoomPageHeaderSearch.types";

const SEARCH_DEBOUNCE_MS = 260;
const MIN_SEARCH_QUERY_LENGTH = 2;
const EMPTY_SEARCH_RESULTS: UseChatRoomPageHeaderSearchResult["headerSearchResults"] =
  [];

/**
 * Управляет поиском по сообщениям в заголовке комнаты.
 *
 * @param options Зависимости для поиска и перехода к найденным сообщениям.
 * @returns Ссылки, состояние и обработчики виджета поиска.
 */
export function useChatRoomPageHeaderSearch({
  roomIdForRequests,
  jumpToMessageById,
  setRoomError,
}: UseChatRoomPageHeaderSearchOptions): UseChatRoomPageHeaderSearchResult {
  const searchAnchorRef = useRef<HTMLButtonElement | null>(null);
  const searchLayerRef = useRef<HTMLDivElement | null>(null);
  const headerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const headerSearchTimerRef = useRef<number | null>(null);
  const headerSearchRequestSeqRef = useRef(0);
  const [isHeaderSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQueryState] = useState("");
  const [headerSearchLoading, setHeaderSearchLoading] = useState(false);
  const [headerSearchResults, setHeaderSearchResults] = useState<
    UseChatRoomPageHeaderSearchResult["headerSearchResults"]
  >([]);

  const cancelPendingSearch = useCallback(() => {
    if (headerSearchTimerRef.current !== null) {
      window.clearTimeout(headerSearchTimerRef.current);
      headerSearchTimerRef.current = null;
    }

    headerSearchRequestSeqRef.current += 1;
  }, []);

  const clearSearch = useCallback(() => {
    cancelPendingSearch();
    setHeaderSearchQueryState("");
    setHeaderSearchResults([]);
    setHeaderSearchLoading(false);
  }, [cancelPendingSearch]);

  const closeRoomSearch = useCallback(() => {
    setHeaderSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  const setHeaderSearchQuery = useCallback(
    (value: string) => {
      setHeaderSearchQueryState(value);
      setHeaderSearchLoading(false);
      if (value.trim().length < MIN_SEARCH_QUERY_LENGTH) {
        cancelPendingSearch();
        setHeaderSearchResults([]);
      }
    },
    [cancelPendingSearch],
  );

  const openRoomSearch = useCallback(() => {
    setHeaderSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        clearSearch();
      } else {
        window.setTimeout(() => headerSearchInputRef.current?.focus(), 0);
      }
      return next;
    });
  }, [clearSearch]);

  const onHeaderSearchResultClick = useCallback(
    (messageId: number) => {
      closeRoomSearch();
      void jumpToMessageById(messageId).then((found) => {
        if (!found) {
          setRoomError("Не удалось найти сообщение в истории");
        }
      });
    },
    [closeRoomSearch, jumpToMessageById, setRoomError],
  );

  useEffect(() => {
    cancelPendingSearch();
  }, [cancelPendingSearch, roomIdForRequests]);

  useEffect(() => {
    return cancelPendingSearch;
  }, [cancelPendingSearch]);

  useEffect(() => {
    if (!isHeaderSearchOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeRoomSearch();
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        closeRoomSearch();
        return;
      }

      if (searchAnchorRef.current?.contains(target)) {
        return;
      }

      if (searchLayerRef.current?.contains(target)) {
        return;
      }

      closeRoomSearch();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [closeRoomSearch, isHeaderSearchOpen]);

  useEffect(() => {
    if (!isHeaderSearchOpen) {
      cancelPendingSearch();
      return;
    }

    const query = headerSearchQuery.trim();
    cancelPendingSearch();

    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      return;
    }

    const requestSeq = headerSearchRequestSeqRef.current + 1;
    headerSearchRequestSeqRef.current = requestSeq;

    headerSearchTimerRef.current = window.setTimeout(() => {
      setHeaderSearchLoading(true);
      void chatController
        .searchMessages(roomIdForRequests, query)
        .then((result) => {
          if (headerSearchRequestSeqRef.current !== requestSeq) {
            return;
          }

          setHeaderSearchResults(result.results);
        })
        .catch(() => {
          if (headerSearchRequestSeqRef.current !== requestSeq) {
            return;
          }

          setHeaderSearchResults([]);
        })
        .finally(() => {
          if (headerSearchRequestSeqRef.current !== requestSeq) {
            return;
          }

          setHeaderSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  }, [
    cancelPendingSearch,
    headerSearchQuery,
    isHeaderSearchOpen,
    roomIdForRequests,
  ]);

  const visibleHeaderSearchLoading =
    isHeaderSearchOpen &&
    headerSearchQuery.trim().length >= MIN_SEARCH_QUERY_LENGTH &&
    headerSearchLoading;
  const visibleHeaderSearchResults =
    isHeaderSearchOpen &&
    headerSearchQuery.trim().length >= MIN_SEARCH_QUERY_LENGTH
      ? headerSearchResults
      : EMPTY_SEARCH_RESULTS;

  return {
    searchAnchorRef,
    searchLayerRef,
    headerSearchInputRef,
    isHeaderSearchOpen,
    headerSearchQuery,
    headerSearchLoading: visibleHeaderSearchLoading,
    headerSearchResults: visibleHeaderSearchResults,
    setHeaderSearchQuery,
    openRoomSearch,
    closeRoomSearch,
    onHeaderSearchResultClick,
  };
}
