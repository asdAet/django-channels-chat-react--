import { createContext, useContext } from "react";

import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";
import { DEFAULT_RUNTIME_CONFIG } from "./runtimeConfig";

/**
 * Описывает значение контекста `RuntimeConfig`.
 */
export type RuntimeConfigContextValue = {
  config: ClientRuntimeConfig;
  ready: boolean;
};

/**
 * Константа `RuntimeConfigContext` хранит используемое в модуле значение.
 */

export const RuntimeConfigContext = createContext<RuntimeConfigContextValue>({
  config: DEFAULT_RUNTIME_CONFIG,
  ready: false,
});

/**
 * Хук useRuntimeConfig управляет состоянием и побочными эффектами текущего сценария.
 * @returns Публичное состояние хука и его обработчики.
 */
export function useRuntimeConfig(): RuntimeConfigContextValue {
  return useContext(RuntimeConfigContext);
}
