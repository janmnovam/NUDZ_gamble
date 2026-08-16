import { type cs } from '@ui/i18n/locales/cs.ts'

/** Supported locales. Czech first — it is the source of truth. */
export type Locale = 'cs' | 'en'

/** Every valid translation key, derived from the Czech source dictionary. */
export type TranslationKey = keyof typeof cs
