import { CircleCheck } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { formatHoursMinutes } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

interface DoneStepProps {
  referenceMinutes: number
  referenceStakes: number
  timeLimitMinutes: number
  stakesLimitCzk: number
  copingCount: number
  /** Day 1, taken from the OnboardingService `complete()` response (not computed here). */
  startDate: Date | null
  onDone: () => void
}

/** Onboarding step 6 — the "all set" summary (Figma "06 Hotovo"). */
export function DoneStep({
  referenceMinutes,
  referenceStakes,
  timeLimitMinutes,
  stakesLimitCzk,
  copingCount,
  startDate,
  onDone,
}: DoneStepProps) {
  const { t, tPlural } = useTranslation()

  const hourUnit = t('onboarding.limits.unitHour')
  const minuteUnit = t('onboarding.limits.unitMinute')
  const currency = t('onboarding.limits.currency')

  const referenceValue = `${formatHoursMinutes(referenceMinutes, hourUnit, minuteUnit)} · ${groupThousands(referenceStakes)} ${currency}`
  const limitValue = `${formatHoursMinutes(timeLimitMinutes, hourUnit, minuteUnit)} · ${groupThousands(stakesLimitCzk)} ${currency}`

  const rows = [
    { label: t('onboarding.done.row.reference'), value: referenceValue },
    { label: t('onboarding.done.row.limits'), value: limitValue },
    {
      label: t('onboarding.done.row.coping'),
      value: tPlural('onboarding.coping.count', copingCount),
    },
  ]

  const startDateLabel = startDate
    ? startDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : ''

  return (
    <Screen
      footer={
        <Button size="md" fullWidth onClick={onDone}>
          {t('onboarding.done.cta')}
        </Button>
      }
    >
      <div className="flex h-36 items-center justify-center">
        <CircleCheck className="text-brand size-14" aria-hidden />
      </div>

      <h1 className="font-display text-ink text-center text-[28px] leading-7 font-semibold tracking-[-0.5px]">
        {t('onboarding.done.title')}
      </h1>

      <Card className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="text-muted text-[14px] leading-5">{row.label}</span>
            <span className="type-label text-ink text-right">{row.value}</span>
          </div>
        ))}
      </Card>

      <Card tone="sunken" className="flex flex-col gap-1">
        <p className="type-title-card text-ink">
          {t('onboarding.done.banner.title', { date: startDateLabel })}
        </p>
        <p className="type-body-sm text-muted">{t('onboarding.done.banner.body')}</p>
      </Card>
    </Screen>
  )
}
