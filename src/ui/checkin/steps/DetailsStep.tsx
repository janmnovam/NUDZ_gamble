import { ArrowLeft } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { DurationWheel } from '@ui/components/DurationWheel.tsx'
import { MoneyField } from '@ui/components/MoneyField.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

const MAX_DAILY_MINUTES = 24 * 60

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
        <DurationWheel
          minutes={minutes}
          onChange={onMinutesChange}
          hoursLabel={t('checkin.time.hoursLabel')}
          minutesLabel={t('checkin.time.minutesLabel')}
          hourUnit={t('checkin.time.unitHour')}
          minuteUnit={t('checkin.time.unitMinute')}
          maxMinutes={MAX_DAILY_MINUTES}
        />
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
