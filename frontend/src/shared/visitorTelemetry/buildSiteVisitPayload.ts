import type { DeviceSnapshot } from "../lib/device";
import type { SiteVisitPayload } from "./types";
import { getOrCreateVisitorId } from "./visitorId";

const readTimeZone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

/**
 * Собирает payload visitor-события из текущего окна и snapshot устройства.
 */
export const buildSiteVisitPayload = (
  snapshot: DeviceSnapshot,
): SiteVisitPayload => ({
  visitorId: getOrCreateVisitorId(),
  pagePath: `${window.location.pathname}${window.location.search}`,
  pageTitle: document.title.trim() || null,
  referrer: document.referrer || null,
  viewportWidth: snapshot.viewportWidth,
  viewportHeight: snapshot.viewportHeight,
  isMobileViewport: snapshot.isMobileViewport,
  hasTouch: snapshot.hasTouch,
  isTouchDesktop: snapshot.isTouchDesktop,
  canHover: snapshot.canHover,
  primaryPointer: snapshot.primaryPointer,
  platform: window.navigator.platform || null,
  language: window.navigator.language || null,
  timeZone: readTimeZone(),
});
