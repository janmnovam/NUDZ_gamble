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
}

/** A user's own coping strategy row, as returned by `list`/`create`. */
export interface CopingStrategyDto {
  id: string
  label: string
  type: CopingType
  active: boolean
  priority: number
}

/** Input for adding a custom coping strategy after onboarding. */
export interface CreateCopingStrategyRequest {
  label: string
}
