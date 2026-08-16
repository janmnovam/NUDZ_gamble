import { useEffect, useMemo, useRef, useState } from 'react'

import { DEMO_USER_ID } from '@/app/constants.ts'
import type { DashboardResponse, DayCellDto } from '@/app/dto/dashboard.ts'
import { CheckInFlow, type CheckInFlowResult } from '@ui/checkin/CheckInFlow.tsx'
import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useCheckInService, useDashboardService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { dayOfMonth } from '@ui/lib/date.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; dashboard: DashboardResponse; behaviorDay: DayCellDto }
  | { status: 'failed' }
  | { status: 'unavailable' }

interface CheckInRouteProps {
  onComplete: () => void
  onCancel: () => void
}

function latestMissingDay(dashboard: DashboardResponse): DayCellDto | undefined {
  const missing = new Set(dashboard.missingDays)
  return [...dashboard.days].reverse().find((day) => missing.has(day.date))
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
  const [time] = useState(() => clientNow())
  const submittingRef = useRef(false)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    void dashboardService.getDashboard(DEMO_USER_ID, time).then(
      (dashboard) => {
        if (!active) return
        const behaviorDay = latestMissingDay(dashboard)
        setState(
          behaviorDay ? { status: 'ready', dashboard, behaviorDay } : { status: 'unavailable' },
        )
      },
      (error: unknown) => {
        console.error('[checkin] getDashboard failed', error)
        if (active) setState({ status: 'failed' })
      },
    )
    return () => {
      active = false
    }
  }, [dashboardService, time])

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
      today={time.slice(0, 10)}
      time={time}
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
            time,
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
