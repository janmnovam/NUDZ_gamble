/** Stable local id for a new record. Server merge stays painless (UUID). */
export function newId(): string {
  return globalThis.crypto.randomUUID()
}
