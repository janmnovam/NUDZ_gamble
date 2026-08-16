import { useEffect, useState } from 'react'

import { type DashboardResponse } from '@/app/dto/dashboard.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { DashboardScreen } from '@ui/dashboard/DashboardScreen.tsx'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { useDashboardService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'

type LoadState =
  { status: 'loading' } | { status: 'ready'; dashboard: DashboardResponse } | { status: 'failed' }

/**
 * Feature entry point for the dashboard, matching `OnboardingFlow` /
 * `CheckInFlow` as the component the app renders for this feature. Unlike
 * those two it has no steps: it loads the read model through `DashboardService`
 * and hands it to the (pure) screen, which is the only place that renders.
 */
export function DashboardFlow() {
  const { t } = useTranslation()
  // Injected by <AppProvider>, which is also how tests supply a fake.
  const dashboardService = useDashboardService()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    void dashboardService.getDashboard(DEMO_USER_ID, clientNow()).then(
      (dashboard) => {
        if (!cancelled) setState({ status: 'ready', dashboard })
      },
      (error: unknown) => {
        console.error('[dashboard] getDashboard failed', error)
        if (!cancelled) setState({ status: 'failed' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [dashboardService])

  if (state.status !== 'ready') {
    return (
      <Screen>
        <p className="type-body text-muted m-auto text-center">
          {state.status === 'loading' ? t('common.loading') : t('common.error')}
        </p>
      </Screen>
    )
  }

  return <DashboardScreen dashboard={state.dashboard} />
}
