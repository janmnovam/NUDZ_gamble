/** ISO-timestamp source; injectable so callers (and tests) control time. */
export type Now = () => string

/** Default clock: real wall-clock time as an ISO 8601 string. */
export const systemNow: Now = () => new Date().toISOString()
