import { type Locale } from '@ui/i18n/types.ts'

export type PluralCategory = 'one' | 'few' | 'other'

/** Pick the CLDR plural category for a count. Czech uses one/few/other; English one/other. */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  if (locale === 'cs') {
    if (count === 1) return 'one'
    if (count >= 2 && count <= 4) return 'few'
    return 'other'
  }
  return count === 1 ? 'one' : 'other'
}
