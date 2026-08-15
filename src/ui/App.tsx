import { useTranslation } from '@ui/i18n/index.ts'

/** Placeholder shell — confirms the toolchain renders. Replace with the real UI. */
export function App() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">{t('app.title')}</h1>
      <p className="text-slate-400">{t('app.subtitle')}</p>
    </main>
  )
}
