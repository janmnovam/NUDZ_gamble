import { Button } from '@ui/components/Button.tsx'
import { CheckboxOption } from '@ui/components/CheckboxOption.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
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
}

/** Onboarding step 5 — coping strategies (Figma "05 Copingová strategie"). */
export function CopingStep({
  strategies,
  selected,
  onSelectedChange,
  customCoping,
  onCustomCopingChange,
  onFinish,
  onBack,
}: CopingStepProps) {
  const { t, t_plural } = useTranslation()

  const count = selected.length + (customCoping ? 1 : 0)

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
          <Button size="md" fullWidth onClick={onFinish} disabled={count === 0}>
            {t('onboarding.coping.cta')}
          </Button>
          <p className="type-body-sm text-faint text-center">
            {t_plural('onboarding.coping.count', count)}
          </p>
        </div>
      }
    >
      <h2 className="type-h2 text-ink">{t('onboarding.coping.title')}</h2>
      <p className="text-muted text-sm leading-5">{t('onboarding.coping.lead')}</p>

      <div className="flex flex-col gap-1.5">
        {strategies.map((strategy) => (
          <CheckboxOption
            key={strategy.label}
            label={strategy.label}
            checked={!!selected.find((s) => s.label === strategy.label)}
            onChange={() => {
              toggle(strategy)
            }}
          />
        ))}
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
