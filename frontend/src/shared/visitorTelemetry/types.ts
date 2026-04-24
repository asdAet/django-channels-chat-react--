import type { DevicePrimaryPointer } from "../lib/device";

/**
 * Описывает payload одноразового visitor-события, отправляемого при загрузке сайта.
 */
export type SiteVisitPayload = {
  visitorId: string;
  pagePath: string;
  pageTitle: string | null;
  referrer: string | null;
  viewportWidth: number;
  viewportHeight: number;
  isMobileViewport: boolean;
  hasTouch: boolean;
  isTouchDesktop: boolean;
  canHover: boolean;
  primaryPointer: DevicePrimaryPointer;
  platform: string | null;
  language: string | null;
  timeZone: string | null;
};
