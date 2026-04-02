import { useCallback, useEffect, useState } from "react";

import { authController } from "../controllers/AuthController";
import type {
  LoginRequestDto as LoginDto,
  RegisterRequestDto as RegisterDto,
  UpdateProfileRequestDto as UpdateProfileDto,
} from "../dto";
import type { UserProfile as UserProfileDto } from "../entities/user/types";
import type { ApiError } from "../shared/api/types";
import {
  clearAllUserCaches,
  invalidateSelfProfile,
  invalidateUserProfile,
} from "../shared/cache/cacheManager";
import { debugLog } from "../shared/lib/debug";

/**
 * Описывает структуру состояния `Auth`.
 */
export type AuthState = {
  user: UserProfileDto | null;
  loading: boolean;
  wsAuthToken: string | null;
};

/**
 * Нормализует profile image.
 * @param user Текущий пользователь.
 * @returns Нормализованное значение после обработки входа.
 */

const normalizeProfileImage = (user: UserProfileDto): UserProfileDto => {
  if (!user.profileImage || user.profileImage.length === 0) {
    return { ...user, profileImage: null };
  }
  return user;
};

/**
 * Хук useAuth управляет состоянием и побочными эффектами текущего сценария.
 */

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    wsAuthToken: null,
  });

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    let active = true;
    authController
      .ensureCsrf()
      .catch((err) => debugLog("CSRF fetch failed", err))
      .finally(() => {
        authController
          .getSession()
          .then((session) => {
            if (!active) return;
            /**
             * Вызывает `setAuth` как шаг текущего сценария.
             * @param props Свойства компонента.

             */

            setAuth({
              user: session.user,
              loading: false,
              wsAuthToken: session.wsAuthToken,
            });
          })
          .catch((err) => {
            /**
             * Вызывает `debugLog` как шаг текущего сценария.
             * @param err Ошибка, полученная в процессе выполнения.

             */

            debugLog("Session fetch failed", err);
            if (!active) return;
            /**
             * Вызывает `setAuth` как шаг текущего сценария.
             * @param props Свойства компонента.

             */

            setAuth({ user: null, loading: false, wsAuthToken: null });
          });
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    await authController.ensureCsrf();
    const session = await authController.login(dto);
    /**
     * Вызывает `setAuth` как шаг текущего сценария.
     * @param props Свойства компонента.

     */

    setAuth({
      user: session.user,
      loading: false,
      wsAuthToken: session.wsAuthToken,
    });
    /**
     * Вызывает `clearAllUserCaches` как шаг текущего сценария.

     */

    clearAllUserCaches();
    return session;
  }, []);

  const loginWithGoogle = useCallback(
    async (token: string, tokenType: "idToken" | "accessToken" = "idToken") => {
      await authController.ensureCsrf();
      const session = await authController.oauthGoogle(token, tokenType);
      setAuth({
        user: session.user,
        loading: false,
        wsAuthToken: session.wsAuthToken,
      });
      clearAllUserCaches();
      return session;
    },
    [],
  );

  const register = useCallback(async (dto: RegisterDto) => {
    await authController.ensureCsrf();
    const session = await authController.register(dto);
    /**
     * Вызывает `setAuth` как шаг текущего сценария.
     * @param props Свойства компонента.

     */

    setAuth({
      user: session.user,
      loading: false,
      wsAuthToken: session.wsAuthToken,
    });
    /**
     * Вызывает `clearAllUserCaches` как шаг текущего сценария.

     */

    clearAllUserCaches();
    return session;
  }, []);

  const logout = useCallback(async () => {
    await authController.logout().catch(() => {});
    /**
     * Вызывает `setAuth` как шаг текущего сценария.
     * @param props Свойства компонента.

     */

    setAuth({ user: null, loading: false, wsAuthToken: null });
    /**
     * Вызывает `clearAllUserCaches` как шаг текущего сценария.

     */

    clearAllUserCaches();
  }, []);

  const updateProfile = useCallback(
    async (dto: UpdateProfileDto) => {
      await authController.ensureCsrf();
      try {
        const { user } = await authController.updateProfile(dto);
        const normalizedUser = normalizeProfileImage(user);
        const previousUsername = auth.user?.username ?? null;
        /**
         * Вызывает `setAuth` как шаг текущего сценария.
         * @returns Ничего не возвращает.
         */

        setAuth((prev) => ({ ...prev, user: normalizedUser }));
        /**
         * Вызывает `invalidateSelfProfile` как шаг текущего сценария.

         */

        invalidateSelfProfile();
        const usernamesToInvalidate = new Set(
          [previousUsername, normalizedUser.username].filter(
            Boolean,
          ) as string[],
        );
        usernamesToInvalidate.forEach((username) =>
          invalidateUserProfile(username),
        );
        return { user: normalizedUser };
      } catch (err) {
        const apiErr = err as ApiError;
        if (
          apiErr &&
          typeof apiErr.status === "number" &&
          apiErr.status === 401
        ) {
          /**
           * Вызывает `setAuth` как шаг текущего сценария.
           * @param props Свойства компонента.

           */

          setAuth({ user: null, loading: false, wsAuthToken: null });
        }
        throw err;
      }
    },
    [auth.user],
  );

  return {
    auth,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
  };
};
