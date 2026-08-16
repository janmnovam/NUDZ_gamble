/**
 * Pure coping-strategy rules — no I/O, no repos. Post-onboarding management
 * (create/toggle/list) reuses these so the app-layer service stays a thin
 * DTO/repo wrapper.
 */
import { DomainError } from '@domain/errors.ts'

/** Max length of a strategy's `label` ("Název"), per the coping library spec. */
export const COPING_LABEL_MAX_LENGTH = 80
/** Max length of an optional detail field (`whenToUse`, `howToStart`), per the coping library spec. */
export const COPING_DETAIL_MAX_LENGTH = 240

/** Trims and validates a user-supplied label. Throws on empty/whitespace-only or over-length input. */
export function normalizeCopingLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed.length === 0) {
    throw new DomainError('validation', 'COPING_EMPTY_LABEL', 'coping: label must not be empty')
  }
  if (trimmed.length > COPING_LABEL_MAX_LENGTH) {
    throw new DomainError(
      'validation',
      'COPING_LABEL_TOO_LONG',
      `coping: label must be at most ${String(COPING_LABEL_MAX_LENGTH)} characters`,
    )
  }
  return trimmed
}

/**
 * Trims an optional detail field ("Kdy ji chci použít?" / "Jak začnu?");
 * blank (or omitted) becomes `null`. Throws if the trimmed value is too long.
 */
export function normalizeCopingDetail(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > COPING_DETAIL_MAX_LENGTH) {
    throw new DomainError(
      'validation',
      'COPING_DETAIL_TOO_LONG',
      `coping: detail must be at most ${String(COPING_DETAIL_MAX_LENGTH)} characters`,
    )
  }
  return trimmed
}

/** The next free priority slot — a new strategy is appended after all existing ones. */
export function nextCopingPriority(existing: readonly { priority: number }[]): number {
  return existing.reduce((max, s) => Math.max(max, s.priority), 0) + 1
}
