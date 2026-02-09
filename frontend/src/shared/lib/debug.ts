export const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error('[Debug]', ...args)
  }
}
