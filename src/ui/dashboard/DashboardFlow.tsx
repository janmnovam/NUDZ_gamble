import { useEffect, useState } from 'react'

import { type DashboardResponse } from '@/app/dto/dashboard.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { TimeMachineModal } from '@ui/admin/TimeMachineModal.tsx'
import { useMultiTap } from '@ui/admin/useMultiTap.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { TabBar } from '@ui/components/TabBar.tsx'
import { DashboardScreen } from '@ui/dashboard/DashboardScreen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { useDashboardService } from '@ui/app/AppContext.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow } from '@ui/clock.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; dashboard: DashboardResponse }
  | { status: 'failed'; message: TranslationKey }

interface DashboardFlowProps {
  onCheckIn?: () => void
}

/**
 * Feature entry point for the dashboard, matching `OnboardingFlow` /
 * `CheckInFlow` as the component the app renders for this feature. Unlike
 * those two it has no steps: it loads the read model through `DashboardService`
 * and hands it to the (pure) screen, which is the only place that renders.
 */
export function DashboardFlow({ onCheckIn }: DashboardFlowProps = {}) {
  const { t } = useTranslation()
  // Injected by <AppProvider>, which is also how tests supply a fake.
  const dashboardService = useDashboardService()
  const userId = useCurrentUser((s) => s.userId)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  // Hidden demo console: the time machine sets a simulated instant, which we
  // pass into the read model in place of the real clock. Changing it re-runs
  // the fetch below, so the dashboard reflects the simulated day.
  const panelOpen = useAdminStore((s) => s.panelOpen)
  const simulatedTime = useAdminStore((s) => s.simulatedTime)
  const openPanel = useAdminStore((s) => s.openPanel)
  const exitTimeMachine = useAdminStore((s) => s.exitTimeMachine)
  const onSecretTap = useMultiTap(7, openPanel)

  useEffect(() => {
    if (userId === null) return
    let cancelled = false

    const time = simulatedTime ?? clientNow()
    void dashboardService.getDashboard(userId, time).then((res) => {
      if (cancelled) return
      if (res.error || !res.data) {
        console.error('[dashboard] getDashboard failed', res.error)
        setState({ status: 'failed', message: errorMessageKey(res.error) })
        return
      }
      setState({ status: 'ready', dashboard: res.data })
    })

    return () => {
      cancelled = true
    }
  }, [dashboardService, userId, simulatedTime])

  if (state.status !== 'ready') {
    // The nav stays even when the dashboard can't load: without it a failure
    // here strands the user with no way to reach the other tabs.
    return (
      <Screen nav={<TabBar active="home" />}>
        <p className="type-body text-muted m-auto text-center">
          {state.status === 'loading' ? t('common.loading') : t(state.message)}
        </p>
      </Screen>
    )
  }

  return (
    <>
      <DashboardScreen
        dashboard={state.dashboard}
        {...(onCheckIn ? { onCheckIn } : {})}
        onSecretTap={onSecretTap}
        timeMachineActive={simulatedTime !== null}
        onExitTimeMachine={exitTimeMachine}
      />
      {panelOpen ? <TimeMachineModal currentDay={state.dashboard.studyDay} /> : null}
    </>
  )
}
