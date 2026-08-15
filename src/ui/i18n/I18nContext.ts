import { createContext } from 'react'

import type { TranslationKey } from './dictionaries/index.ts'
import type { Locale } from './locale.ts'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
