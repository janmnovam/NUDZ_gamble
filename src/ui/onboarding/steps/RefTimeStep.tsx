import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { DurationWheel } from '@ui/components/DurationWheel.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface RefTimeStepProps {
  /** Reference weekly time in minutes (the value the domain layer will store). */
  minutes: number
  onMinutesChange: (minutes: number) => void
  onNext: () => void
  onBack: () => void
}

/** Onboarding step 2 — reference weekly time (Figma "02 Referenční týden — čas"). */
export function RefTimeStep({ minutes, onMinutesChange, onNext, onBack }: RefTimeStepProps) {
  const { t } = useTranslation()

  return (
    <Screen
      header={<StepHeader current={1} total={4} onBack={onBack} />}
      contentClassName="gap-4"
      footer={
        <Button size="md" fullWidth onClick={onNext}>
          {t('common.continue')}
        </Button>
      }
    >
      <p className="type-overline text-faint">{t('onboarding.refTime.overline')}</p>
      <h2 className="type-h2 text-ink">{t('onboarding.refTime.title')}</h2>
      <p className="text-muted text-sm leading-5">{t('onboarding.refTime.lead')}</p>

      <Card padding="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="type-body-emphasis text-ink">{t('onboarding.refTime.time.label')}</span>
        </div>
        <DurationWheel
          minutes={minutes}
          onChange={onMinutesChange}
          hoursLabel={t('onboarding.refTime.hoursLabel')}
          minutesLabel={t('onboarding.refTime.minutesLabel')}
          hourUnit={t('onboarding.refTime.unitHour')}
          minuteUnit={t('onboarding.refTime.unitMinute')}
        />
      </Card>

      <Card tone="sunken" className="flex flex-col gap-1">
        <p className="type-body-sm text-muted">{t('onboarding.refTime.disclaimer.body')}</p>
      </Card>
    </Screen>
  )
}
