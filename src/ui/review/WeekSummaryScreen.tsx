import { ArrowLeft, Info } from 'lucide-react'

import { Card } from '@ui/components/Card.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { StatusChip } from '@ui/review/components/StatusChip.tsx'
import { ReviewShell } from '@ui/review/components/ReviewShell.tsx'
import type { FinalSummaryWeek, ReviewDayCell } from '@ui/review/types.ts'
import { cn } from '@ui/lib/cn.ts'

interface WeekSummaryScreenProps {
  week: FinalSummaryWeek
  onBack: () => void
  onExport: () => void
}

function DayCell({ day }: { day: ReviewDayCell }) {
  const missing = day.state === 'missing'

  return (
    <div
      className={cn(
        'flex h-[62px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-md',
        missing ? 'bg-warning-subtle text-warning' : 'bg-brand-subtle text-ink',
      )}
    >
      <span className={cn('type-overline', missing ? 'text-warning' : 'text-faint')}>
        {day.dayLabel}
      </span>
      <span className={cn('type-label', missing ? 'text-warning' : 'text-ink')}>
        {day.dayNumber}
      </span>
      <span
        className={cn('size-1.5 rounded-full', missing ? 'bg-warning' : 'bg-status-ok')}
        aria-hidden
      />
    </div>
  )
}

function SummaryRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted text-[14px] leading-5">{label}</span>
      <span className={cn('type-label text-right', danger ? 'text-[#9e4224]' : 'text-ink')}>
        {value}
      </span>
    </div>
  )
}

export function WeekSummaryScreen({ week, onBack, onExport }: WeekSummaryScreenProps) {
  const { t } = useTranslation()

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
        <h1 className="type-title-card text-ink">
          {t('review.week.label', { week: week.weekNo })}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <Card tone="sunken" className="flex gap-2.5" padding="p-3">
          <Info className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <p className="type-label text-ink">
              {t('review.week.closedTitle', { week: week.weekNo })}
            </p>
            <p className="type-body-sm text-muted">{t('review.week.closedBody')}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3" padding="p-4">
          <div className="flex flex-col gap-3">
            <p className="type-overline text-faint">
              {t('review.week.summaryOverline', { week: week.weekNo })}
            </p>
            <StatusChip status={week.status} className="self-start" />
          </div>

          <SummaryRow
            label={t('review.week.time')}
            value={`${week.timeUsedLabel} ${t('review.week.of')} ${week.timeLimitLabel}`}
          />
          <SummaryRow
            label={t('review.week.stakes')}
            value={`${week.stakesUsedLabel} ${t('review.week.of')} ${week.stakesLimitLabel}`}
            danger={week.status === 'PREKROCENO'}
          />
          <SummaryRow
            label={t('review.week.filled')}
            value={t('review.week.filledValue', {
              filled: week.filledDays,
              total: week.totalDays,
            })}
          />

          <div className="bg-line h-px w-full" />

          <p className="type-overline text-faint">{t('review.week.progressTitle')}</p>
          <div className="grid grid-cols-7 gap-1">
            {week.days.map((day) => (
              <DayCell key={`${day.dayLabel}-${String(day.dayNumber)}`} day={day} />
            ))}
          </div>
          <p className="type-body-sm text-faint">{t('review.week.missingNote')}</p>
        </Card>
      </div>
    </ReviewShell>
  )
}
