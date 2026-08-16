/**
 * Coping DTO ⟷ domain mapping. Pure translation only — no I/O.
 */
import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { CopingStrategy, CopingStrategyDefault } from '@domain/model.ts'

/** A predefined suggestion → the UI-shaped picker option (`code` becomes `id`). */
export function toCopingSuggestionDto(d: CopingStrategyDefault): CopingSuggestionDto {
  return { id: d.code, label: d.label, type: 'default' }
}

/** A persisted strategy → the UI-shaped management-screen row (`copingStrategyId` becomes `id`). */
export function toCopingStrategyDto(s: CopingStrategy): CopingStrategyDto {
  return {
    id: s.copingStrategyId,
    label: s.label,
    type: s.type,
    active: s.active,
    priority: s.priority,
  }
}
