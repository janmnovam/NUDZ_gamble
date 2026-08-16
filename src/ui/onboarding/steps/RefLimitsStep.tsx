import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { DurationWheel } from '@ui/components/DurationWheel.tsx'
import { MoneyField } from '@ui/components/MoneyField.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { formatHoursMinutes } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

interface RefLimitsStepProps {
  referenceStakes: number
  /** Suggested (80%) limits from the OnboardingService, used as the slider defaults. */
  suggestedTimeMinutes: number
  suggestedStakesCzk: number
  /** The 90% cap from the OnboardingService — the wheel/field upper bounds. */
  timeCapMinutes: number
  stakesCapCzk: number
  /** Current limits, or null to fall back to the suggested value. */
  timeLimit: number | null
  stakesLimit: number | null
  onTimeLimitChange: (value: number) => void
  onStakesLimitChange: (value: number) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Onboarding step 4 — suggested limits with the 90% cap. The time and stakes use
 * the same inputs as the reference screens (duration wheel + money field); the
 * cap is enforced by the wheel's hour range and the field's `maxValue`.
 */
export function RefLimitsStep({
  referenceStakes,
  suggestedTimeMinutes,
  suggestedStakesCzk,
  timeCapMinutes,
  stakesCapCzk,
  timeLimit,
  stakesLimit,
  onTimeLimitChange,
  onStakesLimitChange,
  onNext,
  onBack,
}: RefLimitsStepProps) {
  const { t } = useTranslation()

  const hourUnit = t('onboarding.limits.unitHour')
  const minuteUnit = t('onboarding.limits.unitMinute')
  const currency = t('onboarding.limits.currency')

  const currentTime = timeLimit ?? suggestedTimeMinutes
  const currentStakes = stakesLimit ?? suggestedStakesCzk

  return (
    <Screen
      header={<StepHeader current={3} total={4} onBack={onBack} />}
      contentClassName="gap-3"
      footer={
        <Button size="md" fullWidth onClick={onNext}>
          {t('common.continue')}
        </Button>
      }
    >
      <h2 className="type-h2 text-ink">{t('onboarding.limits.title')}</h2>
      <p className="text-muted text-sm leading-5">{t('onboarding.limits.lead')}</p>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('onboarding.limits.time.label')}</span>
          <span className="type-body-sm text-faint">
            {t('onboarding.limits.time.sub', {
              reference: formatHoursMinutes(suggestedTimeMinutes, hourUnit, minuteUnit),
            })}
          </span>
        </div>
        <DurationWheel
          minutes={currentTime}
          onChange={onTimeLimitChange}
          hoursLabel={t('onboarding.refTime.hoursLabel')}
          minutesLabel={t('onboarding.refTime.minutesLabel')}
          hourUnit={t('onboarding.refTime.unitHour')}
          minuteUnit={t('onboarding.refTime.unitMinute')}
          maxMinutes={timeCapMinutes}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('onboarding.limits.stakes.label')}</span>
          <span className="type-body-sm text-faint">
            {t('onboarding.limits.stakes.sub', { reference: groupThousands(referenceStakes) })}
          </span>
        </div>
        <MoneyField
          value={currentStakes}
          onChange={onStakesLimitChange}
          maxValue={stakesCapCzk}
          ariaLabel={t('onboarding.limits.stakes.label')}
          currencySuffix={currency}
        />
      </Card>

      <p className="type-body-sm text-muted">{t('onboarding.limits.footnote')}</p>
    </Screen>
  )
}
