import { useCallback } from "react";

import type {
  UseChatRoomPageUiActionsOptions,
  UseChatRoomPageUiActionsResult,
} from "./useChatRoomPageUiActions.types";

/**
 * Собирает UI-обработчики для панели информации и мобильной навигации.
 *
 * @param options Зависимости для локальных UI-действий страницы.
 * @returns Стабильные callbacks для презентационного слоя.
 */
export function useChatRoomPageUiActions({
  details,
  roomIdForRequests,
  openInfoPanel,
  openDrawer,
}: UseChatRoomPageUiActionsOptions): UseChatRoomPageUiActionsResult {
  const openUserProfile = useCallback(
    (actorRef: string) => {
      if (!actorRef) {
        return;
      }

      openInfoPanel("profile", actorRef);
    },
    [openInfoPanel],
  );

  const openDirectInfo = useCallback(() => {
    if (!details?.peer?.publicRef && !details?.peer?.username) {
      return;
    }

    openInfoPanel("direct", roomIdForRequests);
  }, [
    details?.peer?.publicRef,
    details?.peer?.username,
    openInfoPanel,
    roomIdForRequests,
  ]);

  const openGroupInfo = useCallback(() => {
    if (details?.kind !== "group") {
      return;
    }

    openInfoPanel("group", roomIdForRequests);
  }, [details?.kind, openInfoPanel, roomIdForRequests]);

  const handleMobileOpenClick = useCallback(() => {
    openDrawer();
  }, [openDrawer]);

  return {
    openUserProfile,
    openDirectInfo,
    openGroupInfo,
    handleMobileOpenClick,
  };
}
