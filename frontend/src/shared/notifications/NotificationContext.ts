import { createContext } from "react";

import type { NotificationsApi } from "./NotificationTypes";

export const NotificationContext = createContext<NotificationsApi | null>(null);
