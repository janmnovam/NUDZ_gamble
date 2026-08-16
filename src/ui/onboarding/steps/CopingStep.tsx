import { Button } from '@ui/components/Button.tsx'
import { CheckboxOption } from '@ui/components/CheckboxOption.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { pluralCategory, type PluralCategory } from '@ui/i18n/plural.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { type CopingSuggestionDto } from '@/app/dto/coping.ts'

const SELECTED_KEYS = {
  one: 'onboarding.coping.selected.one',
  few: 'onboarding.coping.selected.few',
  other: 'onboarding.coping.selected.other',
} as const satisfies Record<PluralCategory, TranslationKey>

interface CopingStepProps {
  /** Predefined strategies, provided by the CopingStrategyService. */
  options: CopingSuggestionDto[]
  /** Ids of the selected predefined strategies. */
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  customStrategy: string
  onCustomStrategyChange: (value: string) => void
  onFinish: () => void
  onBack: () => void
}

/** Onboarding step 5 — coping strategies (Figma "05 Copingová strategie"). */
export function CopingStep({
  options,
  selected,
  onSelectedChange,
  customStrategy,
  onCustomStrategyChange,
  onFinish,
  onBack,
}: CopingStepProps) {
  const { t, locale } = useTranslation()

  const count = selected.length + (customStrategy.trim().length > 0 ? 1 : 0)

  const toggle = (id: string) => {
    onSelectedChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
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
            {t(SELECTED_KEYS[pluralCategory(locale, count)], { count })}
          </p>
        </div>
      }
    >
      <h2 className="type-h2 text-ink">{t('onboarding.coping.title')}</h2>
      <p className="text-muted text-sm leading-5">{t('onboarding.coping.lead')}</p>

      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <CheckboxOption
            key={option.id}
            label={option.label}
            checked={selected.includes(option.id)}
            onChange={() => {
              toggle(option.id)
            }}
          />
        ))}
      </div>

      <TextField
        label={t('onboarding.coping.custom.label')}
        value={customStrategy}
        onChange={onCustomStrategyChange}
        placeholder={t('onboarding.coping.custom.placeholder')}
      />
    </Screen>
  )
}
