import { ChevronRight, Lock } from 'lucide-react'

import { useTranslation } from '@ui/i18n/context.ts'
import { StatusChip, type ChipStatus } from '@ui/components/StatusChip.tsx'
import { ReviewShell } from '@ui/review/components/ReviewShell.tsx'
import type { FinalSummaryViewModel, FinalSummaryWeek } from '@ui/review/types.ts'

interface FinalSummaryScreenProps {
  summary: FinalSummaryViewModel
  onOpenWeek: (week: FinalSummaryWeek) => void
  onOpenProgramme: () => void
  onExport: () => void
}

/**
 * A running week shows that it is under way and an elapsed one that it still
 * needs closing — neither is a verdict, which only a reviewed week has.
 */
function chipFor(week: FinalSummaryWeek): ChipStatus {
  if (week.state === 'running') return 'PROBIHA'
  return week.status ?? 'CHYBI_UZAVRENI'
}

export function FinalSummaryScreen({
  summary,
  onOpenWeek,
  onOpenProgramme,
  onExport,
}: FinalSummaryScreenProps) {
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

        {/* One card per week, as drawn — a locked week is a plain surface, not a
            button, so there is no affordance for a week with nothing to show. */}
        <div className="flex flex-col gap-2">
          {summary.weeks.map((week) =>
            week.state === 'locked' ? (
              // Locked: the canvas tint and the lighter border read as recessed
              // next to a reached week's white surface and stronger border.
              <div
                key={week.weekNo}
                className="bg-canvas border-line flex h-[52px] items-center gap-3 rounded-sm border px-3"
              >
                <span className="type-body-emphasis text-faint flex-1">
                  {t('review.week.label', { week: week.weekNo })}
                </span>
                <Lock
                  className="text-faint size-[18px] shrink-0"
                  aria-label={t('review.week.locked')}
                />
              </div>
            ) : (
              <button
                key={week.weekNo}
                type="button"
                onClick={() => {
                  onOpenWeek(week)
                }}
                className="bg-surface border-line-strong focus-visible:ring-brand flex h-[52px] w-full items-center gap-3 rounded-sm border px-3 text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="type-body-emphasis text-ink flex-1">
                  {t('review.week.label', { week: week.weekNo })}
                </span>
                <StatusChip status={chipFor(week)} />
                <ChevronRight className="text-muted size-6 shrink-0" aria-hidden />
              </button>
            ),
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="type-label text-ink">{t('review.final.limitsDoneTitle')}</p>
          <p className="type-body-sm text-muted">{t('review.final.limitsDoneBody')}</p>
        </div>

        <button
          type="button"
          onClick={onOpenProgramme}
          className="bg-surface border-line-strong focus-visible:ring-brand flex h-[52px] w-full items-center gap-3 rounded-sm border px-3 text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="type-body-emphasis text-ink flex-1">{t('review.programme.entry')}</span>
          <ChevronRight className="text-muted size-6 shrink-0" aria-hidden />
        </button>
      </div>
    </ReviewShell>
  )
}
