import { createContext, useContext } from 'react'

import { type App } from '@/core/index.ts'

/** The wired composition root (inbound services), or null outside a provider. */
export const AppContext = createContext<App | null>(null)

/** The onboarding inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useOnboardingService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useOnboardingService must be used within an <AppProvider>')
  }
  return app.onboarding
}

/** The coping-strategy inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useCopingService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useCopingService must be used within an <AppProvider>')
  }
  return app.coping
}

/** The check-in inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useCheckInService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useCheckInService must be used within an <AppProvider>')
  }
  return app.checkIn
}

/** The dashboard inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useDashboardService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useDashboardService must be used within an <AppProvider>')
  }
  return app.dashboard
}

/** The export inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useExportService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useExportService must be used within an <AppProvider>')
  }
  return app.export
}

/** The review inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useReviewService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useReviewService must be used within an <AppProvider>')
  }
  return app.review
}
