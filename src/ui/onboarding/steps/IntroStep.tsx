import { CircleCheck, Phone } from 'lucide-react'

import { Button } from '@ui/components/Button.tsx'
import { Card } from '@ui/components/Card.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'

const BULLET_KEYS = [
  'onboarding.intro.bullet.checkin',
  'onboarding.intro.bullet.local',
  'onboarding.intro.bullet.export',
] as const satisfies readonly TranslationKey[]

interface IntroStepProps {
  onNext: () => void
}

/** Onboarding step 1 — intro & disclaimer (Figma "01 Úvod a disclaimer"). */
export function IntroStep({ onNext }: IntroStepProps) {
  const { t } = useTranslation()

  return (
    <Screen
      footer={
        <Button size="md" fullWidth onClick={onNext}>
          {t('onboarding.intro.cta')}
        </Button>
      }
    >
      <h1 className="type-h1 text-ink whitespace-pre-line">{t('onboarding.intro.title')}</h1>

      <p className="type-body text-muted">{t('onboarding.intro.lead')}</p>

      <ul className="flex flex-col gap-3">
        {BULLET_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-2.5">
            <CircleCheck className="text-success size-5 shrink-0" aria-hidden />
            <span className="text-ink text-[14px] leading-5">{t(key)}</span>
          </li>
        ))}
      </ul>

      <Card tone="sunken" className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Phone className="text-ink size-4.5 shrink-0" aria-hidden />
          <span className="type-body-emphasis text-ink">
            {t('onboarding.intro.disclaimer.title')}
          </span>
        </div>
        <p className="type-body-sm text-muted">{t('onboarding.intro.disclaimer.body')}</p>
      </Card>
    </Screen>
  )
}
