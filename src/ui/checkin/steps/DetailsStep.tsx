import { ArrowLeft } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { MoneyField } from '@ui/components/MoneyField.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface DetailsStepProps {
  minutes: number
  stakes: number
  programDayLabel?: string | undefined
  weekLabel?: string | undefined
  behaviorDateLabel?: string | undefined
  onMinutesChange: (minutes: number) => void
  onStakesChange: (stakes: number) => void
  onBack: () => void
  onComplete: () => void
}

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

export function DetailsStep({
  minutes,
  stakes,
  programDayLabel,
  weekLabel,
  behaviorDateLabel,
  onMinutesChange,
  onStakesChange,
  onBack,
  onComplete,
}: DetailsStepProps) {
  const { t } = useTranslation()
  const split = splitMinutes(minutes)

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
      footer={
        <Button size="md" fullWidth onClick={onComplete} disabled={minutes <= 0}>
          {t('common.continue')}
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        {programDayLabel ? <p className="sr-only">{programDayLabel}</p> : null}
        {weekLabel ? <p className="sr-only">{weekLabel}</p> : null}
        <p className="type-overline text-faint">
          {t('checkin.shared.title', {
            date: behaviorDateLabel ?? t('checkin.shared.yesterday'),
          })}
        </p>
        <h1 className="type-h2 text-ink">{t('checkin.played.question')}</h1>
      </div>

      <Card className="flex flex-col gap-1.5" padding="px-4 pt-3 pb-4">
        <p className="type-label text-muted">{t('checkin.time.cardLabel')}</p>
        <div className="flex items-center gap-3 py-1">
          <label className="focus-within:ring-brand flex flex-1 flex-col items-center rounded-sm focus-within:ring-2">
            <span className="sr-only">{t('checkin.time.hoursLabel')}</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label={t('checkin.time.hoursLabel')}
              value={split.hours === 0 ? '' : String(split.hours)}
              onChange={(event) => {
                const hours = Math.min(Number(event.target.value.replace(/\D/g, '') || '0'), 99)
                onMinutesChange(hours * 60 + split.minutes)
              }}
              className="font-display text-ink h-[38px] w-full bg-transparent text-center text-[32px] leading-[38px] font-semibold outline-none"
              placeholder="0"
            />
            <span className="text-faint text-[13px] leading-[18px]">
              {t('checkin.time.hoursUnitFull')}
            </span>
          </label>
          <span className="bg-line h-[46px] w-px shrink-0" aria-hidden />
          <label className="focus-within:ring-brand flex flex-1 flex-col items-center rounded-sm focus-within:ring-2">
            <span className="sr-only">{t('checkin.time.minutesLabel')}</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label={t('checkin.time.minutesLabel')}
              value={split.minutes === 0 ? '' : String(split.minutes)}
              onChange={(event) => {
                const nextMinutes = Math.min(
                  Number(event.target.value.replace(/\D/g, '') || '0'),
                  59,
                )
                onMinutesChange(split.hours * 60 + nextMinutes)
              }}
              className="font-display text-ink h-[38px] w-full bg-transparent text-center text-[32px] leading-[38px] font-semibold outline-none"
              placeholder="0"
            />
            <span className="text-faint text-[13px] leading-[18px]">
              {t('checkin.time.minutesUnitFull')}
            </span>
          </label>
        </div>
      </Card>

      <h2 className="type-h2 text-ink">{t('checkin.stakes.title')}</h2>

      <Card className="flex flex-col gap-1.5" padding="px-4 py-3">
        <p className="type-label text-muted">{t('checkin.stakes.weekLabel')}</p>
        <MoneyField
          value={stakes}
          onChange={onStakesChange}
          ariaLabel={t('checkin.stakes.fieldLabel')}
          currencySuffix={t('checkin.stakes.currency')}
        />
      </Card>
    </Screen>
  )
}
