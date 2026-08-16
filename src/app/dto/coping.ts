import type { CopingType } from '@domain/model.ts'

/**
 * Coping DTOs — the UI-shaped surface of the inbound `CopingStrategyService`.
 * The onboarding picker needs a stable id, a display label, and the origin type;
 * the domain `CopingStrategyDefault.code` maps to `id` via
 * `@/app/mappers/copingMapper.ts`.
 */
export interface CopingSuggestionDto {
  /** Stable identifier — the domain default's `code`. */
  id: string
  label: string
  type: CopingType
  /** Optional one-line summary used by the strategy library card. */
  summary?: string
}

/** A user's own coping strategy row, as returned by `list`/`create`/`update`. */
export interface CopingStrategyDto {
  id: string
  label: string
  type: CopingType
  active: boolean
  priority: number
  /** Optional detail, only ever set for `type: 'custom'` — "Kdy ji chci použít?" */
  whenToUse: string | null
  /** Optional detail, only ever set for `type: 'custom'` — "Jak začnu?" */
  howToStart: string | null
}

/** Input for adding a custom coping strategy after onboarding. */
export interface CreateCopingStrategyRequest {
  label: string
  whenToUse?: string | null
  howToStart?: string | null
}

/**
 * Input for editing an existing **custom** strategy's label and/or optional
 * detail fields. Omitted keys are left untouched; catalog strategies reject
 * the edit.
 */
export interface UpdateCopingStrategyRequest {
  label?: string
  whenToUse?: string | null
  howToStart?: string | null
}
