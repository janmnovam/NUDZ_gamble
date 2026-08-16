import { ArrowRight, CircleCheck, Info } from 'lucide-react'

import { type AxisDto, type DayCellDto, type DashboardResponse } from '@/app/dto/dashboard.ts'
import { Banner } from '@ui/components/Banner.tsx'
import { cn } from '@ui/lib/cn.ts'
import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { DayCell, type DayCellState } from '@ui/components/DayCell.tsx'
import { LimitBar } from '@ui/components/LimitBar.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { StatusChip } from '@ui/components/StatusChip.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { dayOfMonth, weekdayAbbrev } from '@ui/lib/date.ts'
import { formatDurationCompact } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'
import { type ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'

/** Programme length in weeks — the "/4" in "Týden 1/4". */
const TOTAL_WEEKS = 4

/**
 * `backfilled` looks the same as `completed` (backfill is never shown to the
 * user — CLAUDE.md), and the day the user is currently on is highlighted as
 * `today`. That day is `future` in the read model, because a check-in always
 * covers the *previous* calendar day — so a day already filled in keeps
 * reading as `completed` rather than being overwritten by the highlight.
 */
function toCellState(day: DayCellDto, currentStudyDay: number): WeekStripState {
  if (day.state === 'completed' || day.state === 'backfilled') return 'completed'
  if (day.studyDay === currentStudyDay && day.state === 'future') return 'today'
  return day.state
}

/** The dashboard's week strip only ever produces these four of DayCell's states. */
type WeekStripState = Extract<DayCellState, 'completed' | 'missing' | 'today' | 'future'>

const DAY_STATE_KEYS = {
  completed: 'dashboard.dayState.completed',
  missing: 'dashboard.dayState.missing',
  today: 'dashboard.dayState.today',
  future: 'dashboard.dayState.future',
} as const satisfies Record<WeekStripState, TranslationKey>

interface DashboardScreenProps {
  dashboard: DashboardResponse
  /** Full 28-day calendar, enriched in the UI with back-fill availability. */
  programme?: ProgrammeSummary
  /** Opens the check-in. Omitted while none is due. */
  onCheckIn?: () => void
  /** Opens backfill for a missing day, by ISO date. */
  onBackfillDay?: (date: string) => void
  /** Fires on each tap of the day heading — the hidden admin gesture. */
  onSecretTap?: () => void
  /** Whether the demo time machine is engaged (shows the exit pill). */
  timeMachineActive?: boolean
  /** Leaves the time machine, back to the real day. */
  onExitTimeMachine?: () => void
}

/**
 * The dashboard (Figma "03 · Dashboard"): where the user stands against both
 * weekly limits, how the current week is filling in, and the single next action.
 *
 * Pure presentation — every number arrives already derived on the
 * `DashboardResponse`, because cumulative usage, weekly totals and the overall
 * state are computed from source records, never stored (CLAUDE.md).
 */
export function DashboardScreen({
  dashboard,
  programme,
  onCheckIn,
  onBackfillDay,
  onSecretTap,
  timeMachineActive = false,
  onExitTimeMachine,
}: DashboardScreenProps) {
  const { t, tPlural, locale } = useTranslation()

  const hourUnit = t('dashboard.unitHour')
  const minuteUnit = t('dashboard.unitMinute')
  const currency = t('dashboard.currency')

  const formatMinutes = (value: number) => formatDurationCompact(value, hourUnit, minuteUnit)
  const formatCzk = (value: number) => `${groupThousands(value)}\u00A0${currency}`

  /**
   * "zbývá 8 h z 8 h" inside the limit, "překročeno o …" past it. Keyed off the
   * status the domain already classified, so the sentence and the chip can
   * never disagree about where "exceeded" begins.
   */
  const axisNote = (axis: AxisDto, format: (value: number) => string) =>
    axis.status === 'PREKROCENO'
      ? t('dashboard.exceededBy', {
          over: format(axis.used - axis.limit),
          limit: format(axis.limit),
        })
      : t('dashboard.remaining', {
          remaining: format(Math.max(axis.remaining, 0)),
          limit: format(axis.limit),
        })

  // The primary CTA only ever fills in *yesterday* (the previous calendar day) —
  // older gaps are backfilled by tapping their day cell. So it's enabled only
  // when yesterday itself is still missing, and disabled once it's filled in
  // (or before day 2, when there is no previous day yet). A missing day further
  // back leaves the CTA disabled; the strip/banner point the user at it instead.
  const previousDayDue = dashboard.days.some(
    (day) => day.studyDay === dashboard.studyDay - 1 && day.state === 'missing',
  )
  // The fill-in banner only ever promises what the user can actually do: it
  // names and counts the missing days still inside the backfill window. A
  // missing day past the window (or in a review-closed week) is surfaced greyed
  // in the strip above, but naming it here would falsely imply "Doplnit je
  // můžete během 5 dní" for a day that can no longer be filled.
  const backfillableDays =
    programme?.weeks.flat().filter((day) => day.backfillable) ??
    dashboard.days.filter((day) => day.backfillable)
  const firstBackfillableDay = backfillableDays[0]?.date
  const showStartNotice = dashboard.missingDays.length === 0 && dashboard.studyDay <= 1
  // Naming the day beats "fill in the missing days": on day 3 you want to be
  // told *which* day, and when there is nothing to do you want to hear that too.
  const missingTitle =
    firstBackfillableDay === undefined
      ? ''
      : backfillableDays.length === 1
        ? t('dashboard.banner.missing.one', {
            day: `${weekdayAbbrev(firstBackfillableDay, locale)} ${String(dayOfMonth(firstBackfillableDay))}`,
          })
        : tPlural('dashboard.banner.missing', backfillableDays.length, {
            count: backfillableDays.length,
          })

  return (
    <Screen
      contentClassName="gap-3"
      header={
        <div className="flex items-start justify-between gap-2 px-4 pt-2 pb-4">
          <div className="flex flex-col gap-0.5">
            <h1
              className="type-h1-display text-ink cursor-default select-none"
              onClick={onSecretTap}
            >
              {t('dashboard.title', { day: Math.max(dashboard.studyDay, 1) })}
            </h1>
            <p className="type-body-sm text-muted">
              {t('dashboard.subtitle', { week: dashboard.weekNo, total: TOTAL_WEEKS })}
            </p>
          </div>
          {timeMachineActive && onExitTimeMachine ? (
            <button
              type="button"
              onClick={onExitTimeMachine}
              className="bg-brand-subtle text-brand-ink type-body-sm focus-visible:ring-brand mt-1 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-medium hover:brightness-95 focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('dashboard.timeMachine.exit')}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      }
      footer={
        <Button
          size="md"
          fullWidth
          variant={previousDayDue ? 'primary' : 'secondary'}
          // Enabled only while yesterday's check-in is still outstanding; once
          // it's filled in (or before day 2, when there is no previous day) the
          // check-in would be for a day that isn't due, so it's disabled.
          // `disabled:opacity-60` overrides the base button's `disabled:opacity-100`
          // so a disabled secondary CTA reads as inactive, not just re-labelled.
          disabled={!previousDayDue || !onCheckIn}
          className="disabled:opacity-60"
          onClick={onCheckIn}
        >
          {previousDayDue ? t('dashboard.cta.checkInDue') : t('dashboard.cta.checkInTomorrow')}
        </Button>
      }
      nav={<TabBar active="home" />}
    >
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('dashboard.overall.label')}</span>
          <StatusChip status={dashboard.overallStatus} />
        </div>

        <LimitBar
          label={t('dashboard.limit.time')}
          percent={dashboard.time.percent}
          percentLabel={t('dashboard.percent', { value: dashboard.time.percent ?? 0 })}
          status={dashboard.time.status}
          thresholdPercent={dashboard.cautionThresholdPercent}
          note={axisNote(dashboard.time, formatMinutes)}
        />

        <LimitBar
          label={t('dashboard.limit.stakes')}
          percent={dashboard.stakes.percent}
          percentLabel={t('dashboard.percent', { value: dashboard.stakes.percent ?? 0 })}
          status={dashboard.stakes.status}
          thresholdPercent={dashboard.cautionThresholdPercent}
          note={axisNote(dashboard.stakes, formatCzk)}
        />
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="type-overline text-faint">{t('dashboard.week.overline')}</p>
        <div className="flex flex-col gap-2">
          {(programme?.weeks ?? [dashboard.days]).map((week, weekIndex) => {
            // Ring the whole current week; a strip fallback (no programme) is
            // itself the current week.
            const isCurrentWeek =
              programme === undefined || week.some((day) => 'today' in day && day.today)
            return (
              <div
                key={week[0]?.date ?? weekIndex}
                className={cn(
                  'grid grid-cols-7 gap-[5px] rounded-2xl border-1 p-1',
                  isCurrentWeek ? 'border-brand' : 'border-transparent',
                )}
              >
                {week.map((day) => {
                  const isProgrammeDay = 'dayOfMonth' in day
                  const weekday = isProgrammeDay ? day.weekday : weekdayAbbrev(day.date, locale)
                  const dayNumber = isProgrammeDay ? day.dayOfMonth : dayOfMonth(day.date)
                  const cellState = isProgrammeDay
                    ? day.state
                    : toCellState(day, dashboard.studyDay)
                  const backfillable = day.backfillable
                  const backfill = backfillable && onBackfillDay ? onBackfillDay : undefined
                  const stateLabel = isProgrammeDay
                    ? t(`review.programme.dayState.${cellState}` as TranslationKey)
                    : t(DAY_STATE_KEYS[cellState as WeekStripState])

                  return (
                    <DayCell
                      key={day.date}
                      weekday={weekday}
                      day={dayNumber}
                      state={cellState}
                      {...(isProgrammeDay ? { ring: day.today } : {})}
                      ariaLabel={t('dashboard.day.aria', {
                        weekday,
                        day: dayNumber,
                        state: stateLabel,
                      })}
                      {...(backfill === undefined
                        ? {}
                        : {
                            onClick: () => {
                              backfill(day.date)
                            },
                          })}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>

        {firstBackfillableDay === undefined ? null : (
          <Banner
            icon={Info}
            title={missingTitle}
            body={t('dashboard.banner.missing.body')}
            {...(onBackfillDay === undefined
              ? {}
              : {
                  onClick: () => {
                    onBackfillDay(firstBackfillableDay)
                  },
                })}
          />
        )}
      </Card>

      {showStartNotice ? (
        <Banner
          icon={Info}
          title={t('dashboard.banner.started.title')}
          body={t('dashboard.banner.started.body')}
        />
      ) : null}

      {dashboard.missingDays.length === 0 && !showStartNotice ? (
        <Banner
          icon={CircleCheck}
          title={t('dashboard.banner.allDone.title')}
          body={t('dashboard.banner.allDone.body')}
        />
      ) : null}
    </Screen>
  )
}
