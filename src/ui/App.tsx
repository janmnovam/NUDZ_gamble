import { useEffect } from 'react'

import { useOnboardingService } from '@ui/app/AppContext.ts'
import { useAppView } from '@ui/app/appView.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { DashboardFlow } from '@ui/dashboard/DashboardFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { OnboardingFlow } from '@ui/onboarding/OnboardingFlow.tsx'
import { FinalSummaryFlow } from '@ui/review/FinalSummaryFlow.tsx'
import { MOCK_FINAL_SUMMARY } from '@ui/review/mockFinalSummary.ts'

export function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </I18nProvider>
  )
}

/**
 * Entry router: decides the initial screen from the persisted onboarding status,
 * then renders it. Lives inside <AppProvider> so the service hooks resolve.
 */
function AppRoutes() {
  const onboarding = useOnboardingService()
  const view = useAppView((state) => state.view)
  const navigate = useAppView((state) => state.navigate)

  // Resolve the entry screen once: returning (onboarded) users land on the
  // dashboard, everyone else starts onboarding. Runs while `view` is 'loading'.
  useEffect(() => {
    let active = true
    void onboarding
      .getStatus()
      .then((status) => {
        if (active) navigate(status.completed ? 'dashboard' : 'onboarding')
      })
      .catch(() => {
        // On a read failure, fall back to onboarding rather than a stuck splash.
        if (active) navigate('onboarding')
      })
    return () => {
      active = false
    }
  }, [onboarding, navigate])

  switch (view) {
    case 'loading':
      // Brief splash while the IndexedDB status read resolves; swap in a real
      // splash/spinner component here if desired.
      return null
    case 'onboarding':
      return (
        <OnboardingFlow
          onComplete={() => {
            navigate('dashboard')
          }}
        />
      )
    case 'dashboard':
      return <DashboardFlow />
    case 'reports':
      return (
        <FinalSummaryFlow
          // ⚠️ Mock data: ReviewService is still a wiring stub, so the weekly
          // summaries are not derived from stored check-ins yet.
          summary={MOCK_FINAL_SUMMARY}
          onExport={() => {
            // ExportService is a wiring stub too — CSV export isn't built.
            console.warn('[reports] export requested, but ExportService is not implemented')
          }}
        />
      )
  }
}
