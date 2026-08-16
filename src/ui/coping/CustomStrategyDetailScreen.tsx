import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react'

import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { type StrategyLibraryItem } from '@ui/coping/StrategyLibraryScreen.tsx'

type CustomStrategy = Extract<StrategyLibraryItem, { kind: 'custom' }>

export interface CustomStrategyChanges {
  title: string
  whenToUse: string
  howToStart: string
}

interface CommonCustomStrategyDetailScreenProps {
  existingStrategyTitles: readonly string[]
  nav?: ReactNode
  showOptionalFields?: boolean
  onBack: () => void
  onSave: (changes: CustomStrategyChanges) => void
}

type CustomStrategyDetailScreenProps = CommonCustomStrategyDetailScreenProps &
  ({ mode: 'create' } | { mode: 'edit'; strategy: CustomStrategy })

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase('cs-CZ')
}

export function CustomStrategyDetailScreen(props: CustomStrategyDetailScreenProps) {
  const { existingStrategyTitles, nav, showOptionalFields = true, onBack, onSave } = props
  const [title, setTitle] = useState(props.mode === 'edit' ? props.strategy.title : '')
  const [whenToUse, setWhenToUse] = useState(
    props.mode === 'edit' ? (props.strategy.whenToUse ?? '') : '',
  )
  const [howToStart, setHowToStart] = useState(
    props.mode === 'edit' ? (props.strategy.sub ?? '') : '',
  )
  const headingRef = useRef<HTMLHeadingElement>(null)
  const normalizedTitle = normalizeTitle(title)
  const hasDuplicateTitle = existingStrategyTitles.some(
    (existingTitle) => normalizeTitle(existingTitle) === normalizedTitle,
  )
  const canSave = normalizedTitle.length > 0 && !hasDuplicateTitle

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    onSave({
      title: title.trim(),
      whenToUse: whenToUse.trim(),
      howToStart: howToStart.trim(),
    })
  }

  return (
    <Screen contentClassName="gap-4 pb-6" nav={nav}>
      <header className="flex flex-col items-start gap-2">
        <button
          type="button"
          aria-label="Zpět do knihovny"
          className="type-label text-brand-ink -my-3 min-h-11 py-3 text-left"
          onClick={onBack}
        >
          ← Zpět do knihovny
        </button>
        <h1 ref={headingRef} tabIndex={-1} className="type-display focus:outline-none">
          {props.mode === 'edit' ? props.strategy.title : 'Nová vlastní strategie'}
        </h1>
        <span className="bg-sunken text-muted rounded-full px-2 py-0.5 text-xs">Vlastní</span>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Název"
          value={title}
          onChange={setTitle}
          maxLength={80}
          required
          hint="Nejvýše 80 znaků."
          {...(hasDuplicateTitle
            ? { error: 'Strategie s tímto názvem už existuje. Zvolte prosím jiný název.' }
            : {})}
        />

        {showOptionalFields ? (
          <div className="flex flex-col gap-3">
            <TextField
              label="Kdy ji chci použít?"
              value={whenToUse}
              onChange={setWhenToUse}
              maxLength={240}
            />
            <TextField
              label="Jak začnu?"
              value={howToStart}
              onChange={setHowToStart}
              maxLength={240}
            />
            <p className="type-body-sm text-faint">Volitelné, nejvýše 240 znaků.</p>
          </div>
        ) : null}

        <div className="pt-2">
          <Button type="submit" fullWidth disabled={!canSave}>
            {props.mode === 'edit' ? 'Uložit změny' : 'Přidat strategii'}
          </Button>
        </div>
      </form>
    </Screen>
  )
}
