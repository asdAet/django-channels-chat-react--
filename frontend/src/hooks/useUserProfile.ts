import { useEffect, useMemo, useState } from "react";

import { apiService } from "../adapters/ApiService";
import type { UserProfile } from "../entities/user/types";
import { debugLog } from "../shared/lib/debug";

type InternalState = {
  publicRef: string | null;
  user: UserProfile | null;
  error: string | null;
};

export type UserProfileState = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
};

/**
 * Управляет состоянием и эффектами хука `useUserProfile`.
 * @param publicRef Входной параметр `publicRef`.
 * @returns Результат выполнения `useUserProfile`.
 */

export const useUserProfile = (publicRef: string) => {
  const [state, setState] = useState<InternalState>({
    publicRef: null,
    user: null,
    error: null,
  });

  const hasPublicRef = Boolean(publicRef);

  /**
   * Выполняет метод `useEffect`.
   * @returns Результат выполнения `useEffect`.
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
         * Выполняет метод `setState`.
         * @param props Входной параметр `props`.
         * @returns Результат выполнения `setState`.
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
         * Выполняет метод `debugLog`.
         * @param err Входной параметр `err`.
         * @returns Результат выполнения `debugLog`.
         */

        debugLog("User profile fetch failed", err);
        if (!active) return;
        /**
         * Выполняет метод `setState`.
         * @param props Входной параметр `props`.
         * @returns Результат выполнения `setState`.
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
