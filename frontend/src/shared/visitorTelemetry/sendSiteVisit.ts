import type { SiteVisitPayload } from "./types";

const VISIT_ENDPOINT = "/api/meta/visit/";

/**
 * Отправляет одноразовое visitor-событие на backend с флагом keepalive.
 */
export const sendSiteVisit = async (
  payload: SiteVisitPayload,
): Promise<boolean> => {
  if (typeof fetch !== "function") {
    return false;
  }

  const response = await fetch(VISIT_ENDPOINT, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.ok;
};
