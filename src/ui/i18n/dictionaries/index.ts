import { cs } from './cs.ts'
import { en } from './en.ts'
import type { TranslationKey } from './cs.ts'
import type { Locale } from '../locale.ts'

export type { TranslationKey } from './cs.ts'

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  cs,
  en,
}
