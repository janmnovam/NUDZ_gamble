/**
 * Pure coping-strategy rules — no I/O, no repos. Post-onboarding management
 * (create/toggle/list) reuses these so the app-layer service stays a thin
 * DTO/repo wrapper.
 */

/** Trims and validates a user-supplied label. Throws on empty/whitespace-only input. */
export function normalizeCopingLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed.length === 0) {
    throw new Error('coping: label must not be empty')
  }
  return trimmed
}

/** The next free priority slot — a new strategy is appended after all existing ones. */
export function nextCopingPriority(existing: readonly { priority: number }[]): number {
  return existing.reduce((max, s) => Math.max(max, s.priority), 0) + 1
}
