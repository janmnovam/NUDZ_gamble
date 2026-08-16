import { useState } from 'react'

import type { CopingStrategyDto } from '@/app/dto/coping.ts'
import { Button } from '@ui/components/Button.tsx'
import { CheckboxOption } from '@ui/components/CheckboxOption.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface CopingScreenProps {
  strategies: CopingStrategyDto[]
  /** Toggle a strategy active/inactive. */
  onToggle: (copingStrategyId: string, active: boolean) => void
  /** Add a custom strategy from the trimmed label. */
  onAdd: (label: string) => void
}

/**
 * Post-onboarding coping-strategy management — the "Váš Coping" tab
 * (`nav.tabs.coping`). Pure presentation, mirroring `DashboardScreen`: the
 * flow owns loading/persisting, this only renders the list and the add form.
 */
export function CopingScreen({ strategies, onToggle, onAdd }: CopingScreenProps) {
  const { t } = useTranslation()
  const [newLabel, setNewLabel] = useState('')

  const submitNew = () => {
    const label = newLabel.trim()
    if (label.length === 0) return
    onAdd(label)
    setNewLabel('')
  }

  return (
    <Screen
      contentClassName="gap-4"
      header={
        <div className="flex flex-col gap-0.5 px-4 pt-2 pb-4">
          <h1 className="type-h1-display text-ink">{t('coping.title')}</h1>
          <p className="type-body-sm text-muted">{t('coping.lead')}</p>
        </div>
      }
      nav={<TabBar active="coping" />}
    >
      {strategies.length === 0 ? (
        <p className="type-body-sm text-muted">{t('coping.empty')}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {strategies.map((strategy) => (
            <CheckboxOption
              key={strategy.id}
              label={strategy.label}
              checked={strategy.active}
              onChange={(active) => {
                onToggle(strategy.id, active)
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <TextField
          label={t('coping.add.label')}
          value={newLabel}
          onChange={setNewLabel}
          placeholder={t('coping.add.placeholder')}
        />
        <Button
          size="md"
          variant="secondary"
          disabled={newLabel.trim().length === 0}
          onClick={submitNew}
        >
          {t('coping.add.cta')}
        </Button>
      </div>
    </Screen>
  )
}
