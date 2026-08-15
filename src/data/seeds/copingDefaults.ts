import { type CopingStrategyDefault } from '@/core/model'

/**
 * Predefined coping strategies offered in onboarding.
 *
 * PLACEHOLDER — pending Dr. Kazmer's final list and copy. The app is not
 * blocked by this: users can always write their own. Replace the contents
 * (labels/codes/priority/reminder_text) once the canonical list arrives.
 */
export const COPING_STRATEGY_DEFAULTS: readonly CopingStrategyDefault[] = [
  { code: 'walk_15min', label: 'Jít na 15 minut ven', priority: 1 },
  { code: 'call_someone', label: 'Zavolat někomu blízkému', priority: 2 },
  { code: 'breathing', label: 'Dechové cvičení', priority: 3 },
]
