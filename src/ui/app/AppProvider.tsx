import { useState, type ReactNode } from 'react'

import { createApp, type App } from '@/core/index.ts'
import { AppContext } from '@ui/app/AppContext.ts'

interface AppProviderProps {
  children: ReactNode
  /** Inject a pre-built app (e.g. a fake in tests); otherwise built once via createApp(). */
  app?: App
}

/**
 * Composition root for the UI: builds the wired app once (the single place that
 * reaches for `createApp`) and provides its inbound services to the tree.
 */
export function AppProvider({ children, app }: AppProviderProps) {
  const [value] = useState<App>(() => app ?? createApp())
  return <AppContext value={value}>{children}</AppContext>
}
