import { type ReviewResponse } from '@/app/dto/review.ts'
import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { DurationWheel } from '@ui/components/DurationWheel.tsx'
import { MoneyField } from '@ui/components/MoneyField.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { formatHoursMinutes } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

interface WeekReviewScreenProps {
  /** The closed week being reviewed; its limits seed the defaults. */
  review: ReviewResponse
  /** Draft next-week limits (owned by the flow). */
  timeMinutes: number
  stakesCzk: number
  onTimeChange: (minutes: number) => void
  onStakesChange: (value: number) => void
  onConfirm: () => void
  submitting: boolean
  /** Already-translated error message from a failed save, if any. */
  errorMessage?: string | null
}

/**
 * Start-of-week prompt for the next week's limits. Shown when the current week
 * has no limits set yet (a closed week's review is pending); the previous
 * limits come pre-filled as the default. Pure presentation — the flow owns the
 * draft state and the service calls.
 */
export function WeekReviewScreen({
  review,
  timeMinutes,
  stakesCzk,
  onTimeChange,
  onStakesChange,
  onConfirm,
  submitting,
  errorMessage,
}: WeekReviewScreenProps) {
  const { t } = useTranslation()

  const hourUnit = t('onboarding.limits.unitHour')
  const minuteUnit = t('onboarding.limits.unitMinute')
  const currency = t('onboarding.limits.currency')

  return (
    <Screen
      background="bg-selected-surface"
      contentClassName="gap-3"
      header={
        <div className="flex flex-col gap-0.5 px-4 pt-2 pb-4">
          <p className="type-overline text-faint">
            {t('review.overline', { week: review.weekNo })}
          </p>
          <h2 className="type-h2 text-ink">{t('review.title')}</h2>
          <p className="text-muted text-sm leading-5">{t('review.lead')}</p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2">
          {errorMessage ? (
            <p className="type-body-sm text-danger text-center">{errorMessage}</p>
          ) : null}
          <Button size="md" fullWidth onClick={onConfirm} disabled={submitting}>
            {t('review.cta')}
          </Button>
        </div>
      }
    >
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('onboarding.limits.time.label')}</span>
          <span className="type-body-sm text-faint">
            {t('review.previous', {
              value: formatHoursMinutes(
                review.suggestedNextLimits.timeMinutes,
                hourUnit,
                minuteUnit,
              ),
            })}
          </span>
        </div>
        <DurationWheel
          minutes={timeMinutes}
          onChange={onTimeChange}
          hoursLabel={t('onboarding.refTime.hoursLabel')}
          minutesLabel={t('onboarding.refTime.minutesLabel')}
          hourUnit={t('onboarding.refTime.unitHour')}
          minuteUnit={t('onboarding.refTime.unitMinute')}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('onboarding.limits.stakes.label')}</span>
          <span className="type-body-sm text-faint">
            {t('review.previous', {
              value: `${groupThousands(review.suggestedNextLimits.stakesAmount)} ${currency}`,
            })}
          </span>
        </div>
        <MoneyField
          value={stakesCzk}
          onChange={onStakesChange}
          ariaLabel={t('onboarding.limits.stakes.label')}
          currencySuffix={currency}
        />
      </Card>

      <Card tone="sunken" className="flex flex-col gap-1">
        <span className="type-title-card text-ink">{t('review.cap.title')}</span>
        <p className="type-body-sm text-muted">{t('review.cap.body')}</p>
      </Card>
    </Screen>
  )
}
