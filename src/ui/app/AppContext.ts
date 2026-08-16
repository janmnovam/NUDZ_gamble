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

/** The read-only support-contact directory. Throws outside <AppProvider>. */
export function useContactService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useContactService must be used within an <AppProvider>')
  }
  return app.contacts
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

/** The reminder inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useReminderService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useReminderService must be used within an <AppProvider>')
  }
  return app.reminder
}

/** The notification inbound port, wired to the data layer. Throws outside <AppProvider>. */
export function useNotificationService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useNotificationService must be used within an <AppProvider>')
  }
  return app.notification
}

/** The admin inbound port (destructive data reset). Throws outside <AppProvider>. */
export function useAdminService() {
  const app = useContext(AppContext)
  if (!app) {
    throw new Error('useAdminService must be used within an <AppProvider>')
  }
  return app.admin
}
