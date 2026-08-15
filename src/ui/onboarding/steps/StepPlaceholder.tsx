import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface StepPlaceholderProps {
  onBack: () => void
}

/**
 * Temporary scaffold for onboarding steps 2–6 so the flow shell is navigable
 * end-to-end. Replace each branch with the real step as it is built.
 */
export function StepPlaceholder({ onBack }: StepPlaceholderProps) {
  const { t } = useTranslation()

  return (
    <Screen
      footer={
        <Button variant="ghost" fullWidth onClick={onBack}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="type-h2 text-ink">{t('onboarding.placeholder.title')}</p>
        <p className="type-body text-muted">{t('onboarding.placeholder.body')}</p>
      </div>
    </Screen>
  )
}
