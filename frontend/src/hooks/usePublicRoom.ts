import { useEffect, useState } from "react";

import { chatController } from "../controllers/ChatController";
import type { RoomDetails as RoomDetailsDto } from "../entities/room/types";
import type { UserProfile as UserProfileDto } from "../entities/user/types";
import { debugLog } from "../shared/lib/debug";

/**
 * Хук usePublicRoom управляет состоянием и побочными эффектами текущего сценария.
 * @param user Текущий пользователь.
 */


export const usePublicRoom = (user: UserProfileDto | null) => {
  const [publicRoom, setPublicRoom] = useState<RoomDetailsDto | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    /**
     * Вызывает `queueMicrotask` как шаг текущего сценария.
     * @returns Ничего не возвращает.
     */

    queueMicrotask(() => setLoading(true));
    let active = true;
    chatController
      .getPublicRoom()
      .then((room) => {
        if (active) setPublicRoom(room);
      })
      .catch(() => {
        /**
         * Вызывает `debugLog` как шаг текущего сценария.

         */

        debugLog("Public room fetch failed");
        if (active) setPublicRoom(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return { publicRoom, loading };
};
