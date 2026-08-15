import { useMemo, useState, type ReactNode } from 'react'

import { I18nContext, type I18nContextValue } from '@ui/i18n/context.ts'
import { interpolate } from '@ui/i18n/interpolate.ts'
import { cs } from '@ui/i18n/locales/cs.ts'
import { en } from '@ui/i18n/locales/en.ts'
import { type Locale, type TranslationKey } from '@ui/i18n/types.ts'

const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = { cs, en }

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

/** Provides the translator to the tree. Czech by default; switchable at runtime. */
export function I18nProvider({ children, initialLocale = 'cs' }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => interpolate(TRANSLATIONS[locale][key], vars),
    }),
    [locale],
  )

  return <I18nContext value={value}>{children}</I18nContext>
}
