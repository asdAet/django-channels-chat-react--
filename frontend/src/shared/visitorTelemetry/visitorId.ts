const VISITOR_ID_STORAGE_KEY = "devils-resting.visitor-id";

let inMemoryVisitorId: string | null = null;

const buildFallbackVisitorId = (): string =>
  `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const createVisitorId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `visitor-${crypto.randomUUID()}`;
  }
  return buildFallbackVisitorId();
};

const readStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Возвращает стабильный анонимный visitorId для одного браузера.
 */
export const getOrCreateVisitorId = (): string => {
  if (inMemoryVisitorId) {
    return inMemoryVisitorId;
  }

  const storage = readStorage();
  const storedValue = storage?.getItem(VISITOR_ID_STORAGE_KEY)?.trim() || "";
  if (storedValue) {
    inMemoryVisitorId = storedValue;
    return storedValue;
  }

  const nextValue = createVisitorId();
  storage?.setItem(VISITOR_ID_STORAGE_KEY, nextValue);
  inMemoryVisitorId = nextValue;
  return nextValue;
};
