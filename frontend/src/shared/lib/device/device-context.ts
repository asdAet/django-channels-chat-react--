import { createContext } from "react";

import type { DeviceSnapshot } from "./types";

/**
 * Константа `DeviceContext`, используемая как device context.
 *
 * @param null Контекст `null`.
 */
export const DeviceContext = createContext<DeviceSnapshot | null>(null);
