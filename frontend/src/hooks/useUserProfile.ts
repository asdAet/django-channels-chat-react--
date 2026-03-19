import { useEffect, useMemo, useState } from "react";

import { apiService } from "../adapters/ApiService";
import type { UserProfile } from "../entities/user/types";
import { debugLog } from "../shared/lib/debug";

/**
 * Описывает структуру состояния `Internal`.
 */
type InternalState = {
  publicRef: string | null;
  user: UserProfile | null;
  error: string | null;
};

/**
 * Описывает структуру состояния `UserProfile`.
 */
export type UserProfileState = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
};

/**
 * Хук useUserProfile управляет состоянием и побочными эффектами текущего сценария.
 * @param publicRef Публичный идентификатор пользователя.
 */


export const useUserProfile = (publicRef: string) => {
  const [state, setState] = useState<InternalState>({
    publicRef: null,
    user: null,
    error: null,
  });

  const hasPublicRef = Boolean(publicRef);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    if (!hasPublicRef) return;

    let active = true;

    apiService
      .getUserProfile(publicRef)
      .then((payload) => {
        if (!active) return;
        const user = payload.user;
        /**
         * Вызывает `setState` как шаг текущего сценария.
         * @param props Свойства компонента.

         */

        setState({
          publicRef,
          user: {
            ...user,
            name: user.name ?? "",
            email: user.email || "",
            profileImage: user.profileImage || null,
            avatarCrop: user.avatarCrop ?? null,
            bio: user.bio || "",
            lastSeen: user.lastSeen || null,
            registeredAt: user.registeredAt || null,
          },
          error: null,
        });
      })
      .catch((err) => {
        /**
         * Вызывает `debugLog` как шаг текущего сценария.
         * @param err Ошибка, полученная в процессе выполнения.

         */

        debugLog("User profile fetch failed", err);
        if (!active) return;
        /**
         * Вызывает `setState` как шаг текущего сценария.
         * @param props Свойства компонента.

         */

        setState({ publicRef, user: null, error: "not_found" });
      });

    return () => {
      active = false;
    };
  }, [hasPublicRef, publicRef]);

  return useMemo<UserProfileState>(() => {
    if (!hasPublicRef) {
      return { user: null, loading: false, error: "not_found" };
    }

    const isStale = state.publicRef !== publicRef;
    const user = isStale ? null : state.user;
    const error = isStale ? null : state.error;
    const loading = isStale || (!user && !error);

    return { user, loading, error };
  }, [hasPublicRef, state.error, state.publicRef, state.user, publicRef]);
};
