import { type Locale, type TranslationKey } from '@ui/i18n/types.ts'

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

// Distributes over each key (K is a naked type param) — infers off `.one`, then
// requires `.few`/`.other` to exist too.
type ExtractPluralBase<K> = K extends `${infer B}.one`
  ? `${B}.few` extends TranslationKey
    ? `${B}.other` extends TranslationKey
      ? B
      : never
    : never
  : never

/** Translation keys that expose all of `.one`/`.few`/`.other`, usable with `tPlural`. */
export type PluralBaseKey = ExtractPluralBase<TranslationKey>

/** Resolve the `.one`/`.few`/`.other` variant key for a base + count. */
export function pluralKey(base: PluralBaseKey, locale: Locale, count: number): TranslationKey {
  return `${base}.${pluralCategory(locale, count)}`
}
