import type { RefObject } from "react";

import type { SearchResultItem } from "../../domain/interfaces/IApiService";
import type { JumpToMessageById, SetRoomError } from "./types";

/**
 * Зависимости, необходимые хуку поиска в заголовке.
 */
export type UseChatRoomPageHeaderSearchOptions = {
  /**
   * Стабильный идентификатор комнаты для поиска по истории.
   */
  roomIdForRequests: string;
  /**
   * Переход к найденному сообщению по идентификатору.
   */
  jumpToMessageById: JumpToMessageById;
  /**
   * Общий setter видимой ошибки страницы.
   */
  setRoomError: SetRoomError;
};

/**
 * Публичное состояние и refs виджета поиска в заголовке.
 */
export type UseChatRoomPageHeaderSearchResult = {
  /**
   * Ref корневого контейнера поиска для outside-click логики.
   */
  searchAnchorRef: RefObject<HTMLButtonElement | null>;
  searchLayerRef: RefObject<HTMLDivElement | null>;
  /**
   * Ref поля ввода поиска для фокуса при открытии.
   */
  headerSearchInputRef: RefObject<HTMLInputElement | null>;
  /**
   * Флаг открытого состояния панели поиска.
   */
  isHeaderSearchOpen: boolean;
  /**
   * Текущее текстовое значение поискового запроса.
   */
  headerSearchQuery: string;
  /**
   * Флаг видимой загрузки поискового запроса.
   */
  headerSearchLoading: boolean;
  /**
   * Результаты поиска для активного запроса.
   */
  headerSearchResults: SearchResultItem[];
  /**
   * Setter текстового запроса поиска.
   */
  setHeaderSearchQuery: (value: string) => void;
  /**
   * Открытие или переключение панели поиска.
   */
  openRoomSearch: () => void;
  /**
   * Закрытие панели поиска и очистка локального состояния.
   */
  closeRoomSearch: () => void;
  /**
   * Переход к выбранному сообщению из результатов.
   */
  onHeaderSearchResultClick: (messageId: number) => void;
};
