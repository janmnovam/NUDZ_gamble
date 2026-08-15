import { createContext, useContext } from 'react'

import { type PluralBaseKey } from '@ui/i18n/plural.ts'
import { type Locale, type TranslationKey } from '@ui/i18n/types.ts'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translate a key into the current locale, filling any `{name}` placeholders. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  /** Translate a pluralized key by count — resolves `.one`/`.few`/`.other` and fills `{count}`. */
  t_plural: (base: PluralBaseKey, count: number, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

/** Access the translator. Throws if used outside <I18nProvider>. */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an <I18nProvider>')
  }
  return context
}
