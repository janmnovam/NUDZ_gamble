import { ChevronRight } from 'lucide-react'

import { Card } from '@ui/components/Card.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { StatusChip } from '@ui/components/StatusChip.tsx'
import { ReviewShell } from '@ui/review/components/ReviewShell.tsx'
import type { FinalSummaryViewModel, FinalSummaryWeek } from '@ui/review/types.ts'

interface FinalSummaryScreenProps {
  summary: FinalSummaryViewModel
  onOpenWeek: (week: FinalSummaryWeek) => void
  onExport: () => void
}

export function FinalSummaryScreen({ summary, onOpenWeek, onExport }: FinalSummaryScreenProps) {
  const { t } = useTranslation()

  return (
    <ReviewShell footerLabel={t('review.exportCta')} onExport={onExport}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="type-overline text-faint">
            {t('review.final.overline', { day: summary.programmeDayLabel })}
          </p>
          <h1 className="font-display text-ink text-[28px] leading-7 font-semibold">
            {t('review.final.title')}
          </h1>
        </div>

        <Card className="flex flex-col gap-3" padding="p-4">
          {summary.weeks.map((week) => (
            <button
              key={week.weekNo}
              type="button"
              onClick={() => {
                onOpenWeek(week)
              }}
              className="focus-visible:ring-brand flex min-h-10 w-full items-center gap-3 rounded-sm py-1 text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="type-body-emphasis text-ink flex-1">
                {t('review.week.label', { week: week.weekNo })}
              </span>
              <StatusChip status={week.status} />
              <ChevronRight className="text-muted size-6 shrink-0" aria-hidden />
            </button>
          ))}
        </Card>

        <div className="flex flex-col gap-1.5">
          <p className="type-label text-ink">{t('review.final.limitsDoneTitle')}</p>
          <p className="type-body-sm text-muted">{t('review.final.limitsDoneBody')}</p>
        </div>
      </div>
    </ReviewShell>
  )
}
