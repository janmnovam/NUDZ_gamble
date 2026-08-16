/**
 * Coping DTOs — the UI-shaped surface of the inbound `CopingStrategyService`.
 * The onboarding picker only needs a stable id and a display label; the domain
 * `CopingStrategyDefault.code` maps to `id` via `@/app/mappers/copingMapper.ts`.
 */
export interface CopingSuggestionDto {
  /** Stable identifier (the domain default's `code`). */
  id: string
  /** Display text shown in the picker (content, not UI copy — already localized). */
  label: string
}
