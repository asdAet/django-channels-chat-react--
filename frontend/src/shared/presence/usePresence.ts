import { useContext } from "react";

import { PresenceContext } from "./context";

/**
 * Хук usePresence управляет состоянием и побочными эффектами текущего сценария.
 */


export const usePresence = () => useContext(PresenceContext);
