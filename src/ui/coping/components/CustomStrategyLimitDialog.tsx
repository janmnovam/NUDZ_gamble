import { useEffect, useId, useRef, type KeyboardEvent } from 'react'

import { Button } from '@ui/components/Button.tsx'

interface CustomStrategyLimitDialogProps {
  onClose: () => void
  onShowStrategies: () => void
}

export function CustomStrategyLimitDialog({
  onClose,
  onShowStrategies,
}: CustomStrategyLimitDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key === 'Tab') {
      const buttons = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      )
      const firstButton = buttons.at(0)
      const lastButton = buttons.at(-1)

      if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault()
        lastButton?.focus()
      } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault()
        firstButton?.focus()
      }
    }
  }

  return (
    <>
      <div className="bg-ink/60 fixed inset-0 z-40" aria-hidden="true" onPointerDown={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="bg-surface fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2.5rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-lg p-5 shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="type-h2">
          Máte maximální počet vlastních strategií
        </h2>
        <p id={descriptionId} className="text-muted text-[0.9375rem] leading-[1.375rem]">
          Můžete mít nejvýše pět vlastních strategií. Pokud chcete přidat další, nejprve některou ze
          svých strategií smažte.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button fullWidth onClick={onShowStrategies}>
            Zobrazit moje strategie
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </div>
    </>
  )
}
