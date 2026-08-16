import { useEffect } from 'react'

import { useOnboardingService } from '@ui/app/AppContext.ts'
import { useAppView } from '@ui/app/appView.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow } from '@ui/clock.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { CheckInRoute } from '@ui/checkin/CheckInRoute.tsx'
import { CopingFlow } from '@ui/coping/CopingFlow.tsx'
import { DashboardFlow } from '@ui/dashboard/DashboardFlow.tsx'
import { useExportDownload } from '@ui/export/useExportDownload.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { useReminderNotifications } from '@ui/notifications/useReminderNotifications.ts'
import { OnboardingFlow } from '@ui/onboarding/OnboardingFlow.tsx'
import { FinalSummaryFlow } from '@ui/review/FinalSummaryFlow.tsx'
import { useFinalSummary } from '@ui/review/useFinalSummary.ts'

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
 * Reports: the four-week summary from `ReviewService`, with the export wired to
 * `ExportService` — it builds the CSVs and hands the ZIP to the browser.
 */
function ReportsSection() {
  const { t } = useTranslation()
  const { exportData } = useExportDownload()
  const summary = useFinalSummary()

  if (summary.status !== 'ready') {
    return (
      <Screen>
        <p className="type-body text-muted m-auto text-center">
          {summary.status === 'loading' ? t('common.loading') : t(summary.message)}
        </p>
      </Screen>
    )
  }

  return (
    <FinalSummaryFlow
      summary={summary.summary}
      programme={summary.programme}
      onExport={exportData}
    />
  )
}

/**
 * Entry router: decides the initial screen from the persisted onboarding status,
 * then renders it. Lives inside <AppProvider> so the service hooks resolve.
 */
function AppRoutes() {
  const onboarding = useOnboardingService()
  const adoptCurrentUser = useCurrentUser((state) => state.setUserId)
  const view = useAppView((state) => state.view)
  const navigate = useAppView((state) => state.navigate)

  useReminderNotifications()

  // Resolve the current user (and entry screen) once from the backend: the
  // service reports who has onboarded — a returning user lands on the dashboard,
  // a fresh/wiped device starts onboarding. Runs while `view` is 'loading'.
  useEffect(() => {
    let active = true
    void onboarding.getStatus(clientNow()).then((res) => {
      if (!active) return
      if (res.error) console.error('[app] getStatus failed', res.error)
      // Cache the id the backend resolved so later screens talk as that user.
      if (res.data?.userId) adoptCurrentUser(res.data.userId)
      navigate(res.data?.completed ? 'dashboard' : 'onboarding')
    })
    return () => {
      active = false
    }
  }, [onboarding, adoptCurrentUser, navigate])

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
      return (
        <DashboardFlow
          onCheckIn={() => {
            navigate('checkin')
          }}
        />
      )
    case 'checkin':
      return (
        <CheckInRoute
          onComplete={() => {
            navigate('dashboard')
          }}
          onCancel={() => {
            navigate('dashboard')
          }}
        />
      )
    case 'coping':
      return <CopingFlow />
    case 'reports':
      return <ReportsSection />
  }
}
