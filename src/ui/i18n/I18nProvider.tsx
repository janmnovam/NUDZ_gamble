import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { dictionaries } from './dictionaries/index.ts'
import type { TranslationKey } from './dictionaries/index.ts'
import { I18nContext } from './I18nContext.ts'
import { DEFAULT_LOCALE } from './locale.ts'
import type { Locale } from './locale.ts'

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  const value = useMemo(() => {
    const dictionary = dictionaries[locale]
    return {
      locale,
      setLocale,
      t: (key: TranslationKey, params?: Record<string, string | number>) =>
        interpolate(dictionary[key], params),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
