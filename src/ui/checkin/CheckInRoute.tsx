import { useEffect, useMemo, useRef, useState } from 'react'

import type { DashboardResponse, DayCellDto } from '@/app/dto/dashboard.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { CheckInFlow, type CheckInFlowResult } from '@ui/checkin/CheckInFlow.tsx'
import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useCheckInService, useDashboardService } from '@ui/app/AppContext.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow, isoForDay } from '@ui/clock.ts'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { dayInWords, dayOfMonth } from '@ui/lib/date.ts'
import type { ISOTimestamp } from '@domain/model.ts'

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready'
      dashboard: DashboardResponse
      behaviorDay: DayCellDto
      time: ISOTimestamp
    }
  | { status: 'failed'; message: TranslationKey }
  | { status: 'unavailable' }

interface CheckInRouteProps {
  onComplete: () => void
  onCancel: () => void
  /**
   * A specific day to fill in, set when the user taps a missing day on the
   * dashboard. When present it overrides the default "latest missing day" pick,
   * so the check-in opens for exactly that date.
   */
  behaviorDate?: string
}

function behaviorDayForCheckIn(
  dashboard: DashboardResponse,
  targetDate?: string,
): DayCellDto | undefined {
  // A tapped backfill targets one exact day; honour it over the auto-pick.
  if (targetDate !== undefined) {
    return dashboard.days.find((day) => day.date === targetDate)
  }

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

export function CheckInRoute({ onComplete, onCancel, behaviorDate }: CheckInRouteProps) {
  const { t, locale } = useTranslation()
  const dashboardService = useDashboardService()
  const checkInService = useCheckInService()
  const userId = useCurrentUser((s) => s.userId)
  const simulatedTime = useAdminStore((s) => s.simulatedTime)
  const interventionStartDate = useAdminStore((s) => s.interventionStartDate)
  const [baseTime] = useState(() => simulatedTime ?? clientNow())
  const submittingRef = useRef(false)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (userId === null) return
    let active = true

    const loadDashboardForCheckIn = async () => {
      const dashboardRes = await dashboardService.getDashboard(userId, baseTime)
      if (dashboardRes.error || !dashboardRes.data) {
        throw new Error(dashboardRes.error?.code ?? 'dashboard unavailable')
      }
      const dashboard = dashboardRes.data
      const behaviorDay = behaviorDayForCheckIn(dashboard, behaviorDate)
      if (behaviorDay) return { dashboard, behaviorDay, time: baseTime }

      // A tapped backfill names one exact day — don't advance to the manual-test
      // "next day" fallback, which is only for the auto-pick path.
      if (behaviorDate !== undefined) return null

      const manualTime = nextManualTestTime(dashboard, interventionStartDate)
      if (manualTime === null || manualTime === baseTime) return null

      const manualRes = await dashboardService.getDashboard(userId, manualTime)
      if (manualRes.error || !manualRes.data) return null
      const manualDashboard = manualRes.data
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
        if (active) setState({ status: 'failed', message: 'common.error' })
      },
    )
    return () => {
      active = false
    }
  }, [baseTime, behaviorDate, dashboardService, interventionStartDate, userId])

  const labels = useMemo(() => {
    if (state.status !== 'ready') return null
    // "Did you gamble yesterday?" only reads right when the day is actually
    // yesterday; a backfill names the day instead ("...v úterý 18?").
    const isYesterday = state.dashboard.studyDay - state.behaviorDay.studyDay === 1
    return {
      programDayLabel: `Den ${String(state.behaviorDay.studyDay)} Vašeho programu`,
      weekLabel: `Týden ${String(state.dashboard.weekNo)} - Den ${String(
        dayWithinWeek(state.behaviorDay.studyDay),
      )}`,
      behaviorDateLabel: behaviorDateLabel(state.behaviorDay.date, locale),
      playedQuestion: isYesterday
        ? t('checkin.played.question')
        : t('checkin.played.questionDated', { day: dayInWords(state.behaviorDay.date, locale) }),
    }
  }, [locale, state, t])

  if (state.status !== 'ready' || !labels || userId === null) {
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
          {state.status === 'loading'
            ? t('common.loading')
            : state.status === 'failed'
              ? t(state.message)
              : t('common.error')}
        </p>
      </Screen>
    )
  }

  return (
    <CheckInFlow
      userId={userId}
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
            userId,
            state.time,
          )
          .then((response) => {
            submittingRef.current = false
            if (response.error || !response.data) {
              // Eligibility refusals (outside the backfill window, closed week)
              // arrive here as a localized envelope — show it, don't swallow it.
              console.error('[checkin] submitCheckIn failed', response.error)
              setState({ status: 'failed', message: errorMessageKey(response.error) })
              return
            }
            if (response.data.ok) {
              onComplete()
              return
            }
            console.error('[checkin] submitCheckIn validation failed', response.data.errors)
            setState({ status: 'failed', message: 'common.error' })
          })
          .catch((error: unknown) => {
            submittingRef.current = false
            console.error('[checkin] submitCheckIn failed', error)
            setState({ status: 'failed', message: 'common.error' })
          })
      }}
      onCancel={onCancel}
    />
  )
}
