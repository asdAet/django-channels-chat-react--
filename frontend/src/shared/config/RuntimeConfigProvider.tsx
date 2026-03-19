import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { apiService } from "../../adapters/ApiService";
import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";
import { debugLog } from "../lib/debug";
import { getRuntimeConfig, setRuntimeConfig } from "./runtimeConfig";
import { RuntimeConfigContext } from "./RuntimeConfigContext";

/**
 * Описывает входные props компонента `RuntimeConfigProvider`.
 */
type RuntimeConfigProviderProps = {
  children: ReactNode;
};

/**
 * Компонент RuntimeConfigProvider рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function RuntimeConfigProvider({
  children,
}: RuntimeConfigProviderProps) {
  const [config, setConfig] = useState<ClientRuntimeConfig>(() =>
    getRuntimeConfig(),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    apiService
      .getClientConfig()
      .then((next) => {
        if (!active) return;
        setRuntimeConfig(next);
        setConfig(next);
      })
      .catch((err) => {
        debugLog("Client config fetch failed, using defaults", err);
      })
      .finally(() => {
        if (!active) return;
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      config,
      ready,
    }),
    [config, ready],
  );

  return (
    <RuntimeConfigContext.Provider value={value}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}
