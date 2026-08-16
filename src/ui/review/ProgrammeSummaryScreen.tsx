import { ArrowLeft, Info } from 'lucide-react'

import { Card } from '@ui/components/Card.tsx'
import { DayCell, type DayCellState } from '@ui/components/DayCell.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { ReviewShell } from '@ui/review/components/ReviewShell.tsx'
import type { ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'
import { formatDurationCompact } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'
import { cn } from '@ui/lib/cn.ts'

/** Static map, so a typo is a compile error rather than a raw key on screen. */
const DAY_STATE_KEYS = {
  completed: 'review.programme.dayState.completed',
  missing: 'review.programme.dayState.missing',
  today: 'review.programme.dayState.today',
  future: 'review.programme.dayState.future',
  locked: 'review.programme.dayState.locked',
  outside: 'review.programme.dayState.outside',
} as const satisfies Record<DayCellState, TranslationKey>

interface ProgrammeSummaryScreenProps {
  summary: ProgrammeSummary
  onBack: () => void
  onExport: () => void
}

function SummaryRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted text-[14px] leading-5">{label}</span>
      <span className={cn('type-label text-right', danger ? 'text-status-exceeded' : 'text-ink')}>
        {value}
      </span>
    </div>
  )
}

/** The whole programme at a glance: totals across all four weeks, then a month grid. */
export function ProgrammeSummaryScreen({ summary, onBack, onExport }: ProgrammeSummaryScreenProps) {
  const { t } = useTranslation()

  const hourUnit = t('dashboard.unitHour')
  const minuteUnit = t('dashboard.unitMinute')
  const minutes = (value: number) => formatDurationCompact(value, hourUnit, minuteUnit)
  const czk = (value: number) => `${groupThousands(value)}\u00A0${t('dashboard.currency')}`
  const of = t('review.week.of')

  return (
    <ReviewShell footerLabel={t('review.exportCta')} onExport={onExport}>
      <div className="flex h-10 items-center gap-3 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-muted hover:bg-sunken focus-visible:ring-brand -m-1 rounded-full p-1 transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-6" aria-hidden />
        </button>
        <h1 className="type-title-card text-ink">{t('review.programme.title')}</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Card tone="sunken" className="flex gap-2.5" padding="p-3">
          <Info className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="type-body-sm text-muted">{t('review.week.closedBody')}</p>
        </Card>

        <Card className="flex flex-col gap-3" padding="p-4">
          <p className="type-overline text-faint">{t('review.programme.summaryOverline')}</p>

          <SummaryRow
            label={t('review.week.time')}
            value={`${minutes(summary.timeUsed)} ${of} ${minutes(summary.timeLimit)}`}
          />
          <SummaryRow
            label={t('review.week.stakes')}
            value={`${czk(summary.stakesUsed)} ${of} ${czk(summary.stakesLimit)}`}
            danger={summary.stakesUsed > summary.stakesLimit}
          />
          <SummaryRow
            label={t('review.week.filled')}
            value={t('review.week.filledValue', {
              filled: summary.filledDays,
              total: summary.totalDays,
            })}
          />

          <div className="bg-line h-px w-full" />

          <p className="type-overline text-faint">{t('review.programme.progressOverline')}</p>
          <div className="flex flex-col gap-2">
            {summary.weeks.map((week) => (
              <div key={week[0]?.date} className="grid grid-cols-7 gap-[5px]">
                {week.map((day) => (
                  <DayCell
                    key={day.date}
                    weekday={day.weekday}
                    day={day.dayOfMonth}
                    state={day.state}
                    ring={day.today}
                    ariaLabel={t('review.programme.dayAria', {
                      weekday: day.weekday,
                      day: day.dayOfMonth,
                      state: t(DAY_STATE_KEYS[day.state]),
                    })}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ReviewShell>
  )
}
