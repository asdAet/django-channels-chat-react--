import { createContext } from "react";

import type { DeviceSnapshot } from "./types";

export const DeviceContext = createContext<DeviceSnapshot | null>(null);
