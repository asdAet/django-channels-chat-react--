import { useContext } from "react";

import { DirectInboxContext } from "./context";

/**
 * Хук useDirectInbox управляет состоянием и побочными эффектами текущего сценария.
 */


export const useDirectInbox = () => useContext(DirectInboxContext);
