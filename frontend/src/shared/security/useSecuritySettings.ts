import { useCallback, useEffect, useState } from "react";

import { apiService } from "../../adapters/ApiService";
import type {
  ChangePasswordInput,
  SecuritySettings,
  TwoFactorLoginInput,
  TwoFactorSetup,
} from "../../domain/interfaces/IApiService";

type SecurityState = {
  security: SecuritySettings | null;
  loading: boolean;
  error: string | null;
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string" && value.trim()) return value;
  }
  return "Не удалось выполнить действие безопасности.";
};

export const useSecuritySettings = (enabled = true) => {
  const [state, setState] = useState<SecurityState>({
    security: null,
    loading: enabled,
    error: null,
  });

  const load = useCallback(async () => {
    if (!enabled) {
      setState({ security: null, loading: false, error: null });
      return null;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { security } = await apiService.getSecuritySettings();
      setState({ security, loading: false, error: null });
      return security;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, [enabled]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    const { security } = await apiService.changePassword(input);
    setState({ security, loading: false, error: null });
    return security;
  }, []);

  const beginTwoFactorSetup = useCallback(async (): Promise<TwoFactorSetup> => {
    const { setup } = await apiService.beginTwoFactorSetup();
    return setup;
  }, []);

  const confirmTwoFactor = useCallback(async (input: TwoFactorLoginInput) => {
    const { security } = await apiService.confirmTwoFactor(input);
    setState({ security, loading: false, error: null });
    return security;
  }, []);

  const disableTwoFactor = useCallback(async (input: TwoFactorLoginInput) => {
    const { security } = await apiService.disableTwoFactor(input);
    setState({ security, loading: false, error: null });
    return security;
  }, []);

  return {
    ...state,
    reload: load,
    changePassword,
    beginTwoFactorSetup,
    confirmTwoFactor,
    disableTwoFactor,
  };
};
