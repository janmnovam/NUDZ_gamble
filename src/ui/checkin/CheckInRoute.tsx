import { useEffect, useMemo, useRef, useState } from 'react'

import { DEMO_USER_ID } from '@/app/constants.ts'
import type { DashboardResponse, DayCellDto } from '@/app/dto/dashboard.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { CheckInFlow, type CheckInFlowResult } from '@ui/checkin/CheckInFlow.tsx'
import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useCheckInService, useDashboardService } from '@ui/app/AppContext.ts'
import { clientNow, isoForDay } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { dayOfMonth } from '@ui/lib/date.ts'
import type { ISOTimestamp } from '@domain/model.ts'

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready'
      dashboard: DashboardResponse
      behaviorDay: DayCellDto
      time: ISOTimestamp
    }
  | { status: 'failed' }
  | { status: 'unavailable' }

interface CheckInRouteProps {
  onComplete: () => void
  onCancel: () => void
}

function behaviorDayForCheckIn(dashboard: DashboardResponse): DayCellDto | undefined {
  const missing = new Set(dashboard.missingDays)
  const latestMissing = [...dashboard.days].reverse().find((day) => missing.has(day.date))
  if (latestMissing) return latestMissing

  // Temporary manual-test fallback: when the dashboard says "check-in bude zítra"
  // there is no missing day, but we still want the CTA to open the previous row.
  if (dashboard.studyDay > 1) {
    return dashboard.days.find((day) => day.studyDay === dashboard.studyDay - 1)
  }
  return undefined
}

function nextManualTestTime(
  dashboard: DashboardResponse,
  interventionStartDate: ISOTimestamp | null,
): ISOTimestamp | null {
  if (interventionStartDate === null) return null
  return isoForDay(interventionStartDate, Math.max(dashboard.studyDay + 1, 2))
}

function dayWithinWeek(studyDay: number): number {
  return ((studyDay - 1) % 7) + 1
}

function behaviorDateLabel(date: string, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(date))
  return `${weekday} ${String(dayOfMonth(date))}.`
}

export function CheckInRoute({ onComplete, onCancel }: CheckInRouteProps) {
  const { t, locale } = useTranslation()
  const dashboardService = useDashboardService()
  const checkInService = useCheckInService()
  const simulatedTime = useAdminStore((s) => s.simulatedTime)
  const interventionStartDate = useAdminStore((s) => s.interventionStartDate)
  const [baseTime] = useState(() => simulatedTime ?? clientNow())
  const submittingRef = useRef(false)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    const loadDashboardForCheckIn = async () => {
      const dashboard = await dashboardService.getDashboard(DEMO_USER_ID, baseTime)
      const behaviorDay = behaviorDayForCheckIn(dashboard)
      if (behaviorDay) return { dashboard, behaviorDay, time: baseTime }

      const manualTime = nextManualTestTime(dashboard, interventionStartDate)
      if (manualTime === null || manualTime === baseTime) return null

      const manualDashboard = await dashboardService.getDashboard(DEMO_USER_ID, manualTime)
      const manualBehaviorDay = behaviorDayForCheckIn(manualDashboard)
      if (!manualBehaviorDay) return null

      return { dashboard: manualDashboard, behaviorDay: manualBehaviorDay, time: manualTime }
    }

    void loadDashboardForCheckIn().then(
      (ready) => {
        if (!active) return
        if (ready) {
          setState({ status: 'ready', ...ready })
          return
        }
        setState({ status: 'unavailable' })
      },
      (error: unknown) => {
        console.error('[checkin] getDashboard failed', error)
        if (active) setState({ status: 'failed' })
      },
    )
    return () => {
      active = false
    }
  }, [baseTime, dashboardService, interventionStartDate])

  const labels = useMemo(() => {
    if (state.status !== 'ready') return null
    return {
      programDayLabel: `Den ${String(state.behaviorDay.studyDay)} Vašeho programu`,
      weekLabel: `Týden ${String(state.dashboard.weekNo)} - Den ${String(
        dayWithinWeek(state.behaviorDay.studyDay),
      )}`,
      behaviorDateLabel: behaviorDateLabel(state.behaviorDay.date, locale),
    }
  }, [locale, state])

  if (state.status !== 'ready' || !labels) {
    return (
      <Screen
        footer={
          state.status === 'loading' ? undefined : (
            <Button size="md" fullWidth variant="secondary" onClick={onCancel}>
              {t('common.back')}
            </Button>
          )
        }
      >
        <p className="type-body text-muted m-auto text-center">
          {state.status === 'loading' ? t('common.loading') : t('common.error')}
        </p>
      </Screen>
    )
  }

  return (
    <CheckInFlow
      userId={DEMO_USER_ID}
      behaviorDate={state.behaviorDay.date}
      weekNo={state.dashboard.weekNo}
      today={state.time.slice(0, 10)}
      time={state.time}
      {...labels}
      onComplete={(result: CheckInFlowResult) => {
        if (submittingRef.current) return
        submittingRef.current = true
        void checkInService
          .submitCheckIn(
            {
              behaviorDate: result.draft.behaviorDate,
              played: result.draft.played,
              timeMin: result.draft.timeMin,
              stakesCzk: result.draft.stakesCzk,
              winningsCzk: 0,
            },
            DEMO_USER_ID,
            state.time,
          )
          .then((response) => {
            submittingRef.current = false
            if (response.ok) {
              onComplete()
              return
            }
            console.error('[checkin] submitCheckIn validation failed', response.errors)
            setState({ status: 'failed' })
          })
          .catch((error: unknown) => {
            submittingRef.current = false
            console.error('[checkin] submitCheckIn failed', error)
            setState({ status: 'failed' })
          })
      }}
      onCancel={onCancel}
    />
  )
}
