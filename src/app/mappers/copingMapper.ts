/**
 * Coping DTO ⟷ domain mapping. Pure translation only — no I/O.
 */
import type { CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { CopingStrategyDefault } from '@domain/model.ts'

/** A predefined suggestion → the UI-shaped picker option (`code` becomes `id`). */
export function toCopingSuggestionDto(d: CopingStrategyDefault): CopingSuggestionDto {
  return { id: d.code, label: d.label }
}
