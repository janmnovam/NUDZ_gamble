import { Info } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { MoneyField } from '@ui/components/MoneyField.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { StepHeader } from '@ui/components/StepHeader.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface RefStakesStepProps {
  /** Reference weekly stakes in whole CZK (the value the domain layer will store). */
  stakes: number
  onStakesChange: (stakes: number) => void
  onNext: () => void
  onBack: () => void
}

/** Onboarding step 3 — reference weekly stakes (Figma "03 Referenční týden — sázky"). */
export function RefStakesStep({ stakes, onStakesChange, onNext, onBack }: RefStakesStepProps) {
  const { t } = useTranslation()

  return (
    <Screen
      header={<StepHeader current={2} total={4} onBack={onBack} />}
      contentClassName="gap-4"
      footer={
        <Button size="md" fullWidth onClick={onNext}>
          {t('common.continue')}
        </Button>
      }
    >
      <p className="type-overline text-faint">{t('onboarding.refStakes.overline')}</p>
      <h2 className="type-h2 text-ink">{t('onboarding.refStakes.title')}</h2>
      <p className="text-muted text-sm leading-5">{t('onboarding.refStakes.lead')}</p>

      <Card padding="px-4 py-2">
        <div className="flex flex-col gap-3">
          <p className="type-label text-muted">{t('onboarding.refStakes.fieldLabel')}</p>
          <MoneyField
            value={stakes}
            onChange={onStakesChange}
            ariaLabel={t('onboarding.refStakes.fieldLabel')}
            currencySuffix={t('onboarding.refStakes.currency')}
          />
          <p className="type-body-sm text-faint">{t('onboarding.refStakes.helper')}</p>
        </div>
      </Card>

      <Card tone="info" className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Info className="text-info size-[18px] shrink-0" aria-hidden />
          <span className="type-body-emphasis text-ink">{t('onboarding.refStakes.why.title')}</span>
        </div>
        <p className="type-body-sm text-muted">{t('onboarding.refStakes.why.body')}</p>
      </Card>
    </Screen>
  )
}
