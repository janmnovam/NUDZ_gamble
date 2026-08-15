import { CircleCheck } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { pluralCategory, type PluralCategory } from '@ui/i18n/plural.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { formatHoursMinutes } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

const COPING_COUNT_KEYS = {
  one: 'onboarding.done.coping.one',
  few: 'onboarding.done.coping.few',
  other: 'onboarding.done.coping.other',
} as const satisfies Record<PluralCategory, TranslationKey>

interface DoneStepProps {
  referenceMinutes: number
  referenceStakes: number
  timeLimitMinutes: number
  stakesLimitCzk: number
  copingCount: number
  /** Day 1, taken from the completeOnboarding response (not computed here). */
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
  const { t, locale } = useTranslation()

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
      value: t(COPING_COUNT_KEYS[pluralCategory(locale, copingCount)], { count: copingCount }),
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

      <Card tone="brand" className="flex flex-col gap-1">
        <p className="type-title-card text-brand">
          {t('onboarding.done.banner.title', { date: startDateLabel })}
        </p>
        <p className="type-body-sm text-muted">{t('onboarding.done.banner.body')}</p>
      </Card>
    </Screen>
  )
}
