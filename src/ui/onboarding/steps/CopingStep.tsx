import { Button } from '@ui/components/Button.tsx'
import { CheckboxOption } from '@ui/components/CheckboxOption.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import type { TranslationKey } from '@ui/i18n/types.ts'
import type { CopingDto } from '@/app/dto/onboarding.ts'
import type { CopingSuggestionDto } from '@/app/dto/coping.ts'

interface CopingStepProps {
  strategies: CopingSuggestionDto[]
  selected: CopingSuggestionDto[]
  onSelectedChange: (selected: CopingSuggestionDto[]) => void
  customCoping: CopingDto | null
  onCustomCopingChange: (value: CopingDto) => void
  onFinish: () => void
  onBack: () => void
  /** Message from a rejected submit — shown above the CTA, not just logged. */
  error?: string
}

interface OnboardingStrategyCopy {
  title: TranslationKey
  description: TranslationKey
}

const ONBOARDING_COPY_BY_STRATEGY_ID: Readonly<Record<string, OnboardingStrategyCopy>> = {
  change_environment: {
    title: 'onboarding.coping.strategy.changeEnvironment.title',
    description: 'onboarding.coping.strategy.changeEnvironment.description',
  },
  reach_out: {
    title: 'onboarding.coping.strategy.reachOut.title',
    description: 'onboarding.coping.strategy.reachOut.description',
  },
  let_urge_pass: {
    title: 'onboarding.coping.strategy.wait.title',
    description: 'onboarding.coping.strategy.wait.description',
  },
  start_small_activity: {
    title: 'onboarding.coping.strategy.activity.title',
    description: 'onboarding.coping.strategy.activity.description',
  },
  remember_why: {
    title: 'onboarding.coping.strategy.reason.title',
    description: 'onboarding.coping.strategy.reason.description',
  },
  reduce_access: {
    title: 'onboarding.coping.strategy.access.title',
    description: 'onboarding.coping.strategy.access.description',
  },
}

/** Onboarding step 5 — coping strategies (Figma "05 Copingová strategie"). */
export function CopingStep({
  error,
  strategies,
  selected,
  onSelectedChange,
  customCoping,
  onCustomCopingChange,
  onFinish,
  onBack,
}: CopingStepProps) {
  const { t } = useTranslation()

  const hasCustomCoping = (customCoping?.label.trim().length ?? 0) > 0
  const count = selected.length + (hasCustomCoping ? 1 : 0)

  const toggle = (strategy: CopingSuggestionDto) => {
    onSelectedChange(
      selected.find((s) => s.id === strategy.id)
        ? selected.filter((s) => s.id !== strategy.id)
        : [...selected, strategy],
    )
  }

  return (
    <Screen
      header={<StepHeader current={4} total={4} onBack={onBack} />}
      contentClassName="gap-4"
      footer={
        <div className="flex flex-col items-center gap-2">
          {error === undefined ? null : (
            <p role="alert" className="type-body-sm text-status-exceeded text-center">
              {error}
            </p>
          )}
          <Button size="md" fullWidth onClick={onFinish} disabled={count === 0}>
            {t('onboarding.coping.cta')}
          </Button>
        </div>
      }
    >
      <h2 className="type-h1-display text-ink">{t('onboarding.coping.title')}</h2>

      <div className="flex flex-col gap-2">
        {strategies.map((strategy) => {
          const copy = ONBOARDING_COPY_BY_STRATEGY_ID[strategy.id]
          const description = copy === undefined ? strategy.summary : t(copy.description)

          return (
            <CheckboxOption
              key={strategy.id}
              label={copy === undefined ? strategy.label : t(copy.title)}
              {...(description === undefined ? {} : { description })}
              checked={selected.some((selectedStrategy) => selectedStrategy.id === strategy.id)}
              onChange={() => {
                toggle(strategy)
              }}
            />
          )
        })}
      </div>

      <TextField
        label={t('onboarding.coping.custom.label')}
        value={customCoping?.label ?? ''}
        onChange={(value) => {
          onCustomCopingChange({ label: value, type: 'custom' })
        }}
        placeholder={t('onboarding.coping.custom.placeholder')}
      />
    </Screen>
  )
}
