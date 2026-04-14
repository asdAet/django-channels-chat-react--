import { useEffect, useRef } from "react";

import { debugLog } from "../lib/debug";
import { useDevice } from "../lib/device";

import { buildSiteVisitPayload } from "./buildSiteVisitPayload";
import { sendSiteVisit } from "./sendSiteVisit";

/**
 * Отправляет одно visitor-событие на каждый полный заход в приложение.
 */
export function SiteVisitTelemetry() {
  const snapshot = useDevice();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) {
      return;
    }

    sentRef.current = true;
    void sendSiteVisit(buildSiteVisitPayload(snapshot)).catch((error: unknown) => {
      debugLog("Site visit telemetry failed", error);
    });
  }, [snapshot]);

  return null;
}
