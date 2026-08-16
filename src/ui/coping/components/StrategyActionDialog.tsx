import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Eye, EyeOff, Star, Trash2, X } from 'lucide-react'

interface CommonStrategyActionDialogProps {
  title: string
  kind: 'catalog' | 'custom'
  onClose: () => void
  onRequestDelete?: () => void
}

type StrategyActionDialogProps = CommonStrategyActionDialogProps &
  (
    | {
        context: 'visible'
        isSelected: boolean
        onHide?: () => void
        onToggleSelected: () => void
      }
    | {
        context: 'hidden'
        onRestore: () => void
      }
  )

export function StrategyActionDialog(props: StrategyActionDialogProps) {
  const { title, kind, onClose, onRequestDelete } = props
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstActionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstActionRef.current?.focus()

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
        aria-label={`Možnosti strategie „${title}“`}
        className="bg-surface border-line fixed top-1/2 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-lg border p-3 shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 px-2 py-1">
          <p className="type-title-card min-w-0 flex-1 truncate">{title}</p>
          <button
            type="button"
            className="text-muted flex size-11 shrink-0 items-center justify-center rounded-full"
            aria-label="Zavřít nabídku možností"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="flex flex-col py-1">
          {props.context === 'visible' ? (
            <>
              <button
                ref={firstActionRef}
                type="button"
                className="type-body-emphasis hover:bg-sunken flex min-h-11 items-center gap-3 rounded-sm px-3 text-left"
                onClick={() => {
                  props.onToggleSelected()
                  onClose()
                }}
              >
                <Star aria-hidden="true" size={22} />
                {props.isSelected ? 'Odebrat z Vybraných' : 'Přidat do Vybraných'}
              </button>
              {props.onHide === undefined ? null : (
                <button
                  type="button"
                  className="type-body-emphasis hover:bg-sunken flex min-h-11 items-center gap-3 rounded-sm px-3 text-left"
                  onClick={() => {
                    props.onHide?.()
                    onClose()
                  }}
                >
                  <EyeOff aria-hidden="true" size={22} />
                  Skrýt
                </button>
              )}
            </>
          ) : (
            <button
              ref={firstActionRef}
              type="button"
              className="type-body-emphasis hover:bg-sunken flex min-h-11 items-center gap-3 rounded-sm px-3 text-left"
              onClick={() => {
                props.onRestore()
                onClose()
              }}
            >
              <Eye aria-hidden="true" size={22} />
              Obnovit
            </button>
          )}
          {kind === 'custom' && onRequestDelete !== undefined ? (
            <button
              type="button"
              className="type-body-emphasis text-danger hover:bg-warning-subtle flex min-h-11 items-center gap-3 rounded-sm px-3 text-left"
              onClick={onRequestDelete}
            >
              <Trash2 aria-hidden="true" size={22} />
              Smazat
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}
