import { ArrowLeft } from 'lucide-react'

import type { DayState } from '@domain/checkin.ts'
import { Card } from '@ui/components/Card.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { cn } from '@ui/lib/cn.ts'

interface PlayedStepProps {
  previousDayState: DayState
  programDayLabel?: string | undefined
  weekLabel?: string | undefined
  behaviorDateLabel?: string | undefined
  /** Pre-built "did you gamble …?" heading; falls back to the yesterday phrasing. */
  playedQuestion?: string | undefined
  onBack: () => void
  onPlayed: () => void
  onNotPlayed: () => void
}

const DAY_STATE_KEYS: Record<DayState, TranslationKey> = {
  completed: 'checkin.dayState.completed',
  backfilled: 'checkin.dayState.backfilled',
  missing: 'checkin.dayState.missing',
  future: 'checkin.dayState.future',
}

function stateTone(state: DayState) {
  return state === 'missing' ? 'sunken' : 'brand'
}

interface BigChoiceProps {
  title: string
  subtitle: string
  onClick: () => void
  className?: string
}

function BigChoice({ title, subtitle, onClick, className }: BigChoiceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-line bg-surface flex h-24 flex-1 flex-col items-center justify-center gap-1 rounded-lg border text-center',
        'hover:bg-sunken focus-visible:ring-brand focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <span className="font-display text-ink text-[28px] leading-7 font-semibold">{title}</span>
      <span className="text-faint text-[13px] leading-[18px]">{subtitle}</span>
    </button>
  )
}

export function PlayedStep({
  previousDayState,
  programDayLabel,
  weekLabel,
  behaviorDateLabel,
  playedQuestion,
  onBack,
  onPlayed,
  onNotPlayed,
}: PlayedStepProps) {
  const { t } = useTranslation()

  return (
    <Screen
      header={
        <div className="flex h-10 items-center px-4 py-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            className="text-muted hover:bg-sunken focus-visible:ring-brand -m-1 rounded-full p-1 transition focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft className="size-6" aria-hidden />
          </button>
        </div>
      }
      contentClassName="gap-4"
    >
      <div className="flex flex-col gap-1">
        {programDayLabel ? <p className="sr-only">{programDayLabel}</p> : null}
        {weekLabel ? <p className="sr-only">{weekLabel}</p> : null}
        <p className="type-overline text-faint">
          {t('checkin.shared.title', {
            date: behaviorDateLabel ?? t('checkin.shared.yesterday'),
          })}
        </p>
        <h1 className="type-h1 text-ink">{playedQuestion ?? t('checkin.played.question')}</h1>
      </div>

      <div className="flex gap-3">
        <BigChoice
          title={t('checkin.played.yesShort')}
          subtitle={t('checkin.played.yes')}
          onClick={onPlayed}
        />
        <BigChoice
          title={t('checkin.played.noShort')}
          subtitle={t('checkin.played.no')}
          onClick={onNotPlayed}
        />
      </div>

      <Card tone={stateTone(previousDayState)} className="flex flex-col gap-1">
        <p className="type-body-emphasis text-ink">{t('checkin.played.noHelpTitle')}</p>
        <p className="type-body-sm text-muted">{t(DAY_STATE_KEYS[previousDayState])}</p>
      </Card>
    </Screen>
  )
}
