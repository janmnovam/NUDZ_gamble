import { useRef, useState, type ReactNode } from 'react'

import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { CustomStrategyLimitDialog } from '@ui/coping/components/CustomStrategyLimitDialog.tsx'
import { DeleteStrategyDialog } from '@ui/coping/components/DeleteStrategyDialog.tsx'
import { StrategyActionDialog } from '@ui/coping/components/StrategyActionDialog.tsx'
import { StrategyCard } from '@ui/coping/components/StrategyCard.tsx'
import { StrategyTabs } from '@ui/coping/components/StrategyTabs.tsx'

/** Cap on user-authored strategies, matching the brief's onboarding limit. */
const MAX_CUSTOM_STRATEGIES = 5

export type StrategyLibraryItem = { id: string; title: string } & (
  { kind: 'catalog'; sub: string } | { kind: 'custom'; sub?: string; whenToUse?: string }
)

interface StrategyLibraryScreenProps {
  selectedStrategies: readonly StrategyLibraryItem[]
  otherStrategies: readonly StrategyLibraryItem[]
  hiddenStrategies: readonly StrategyLibraryItem[]
  customStrategyCount: number
  nav?: ReactNode
  canOpenStrategy?: (strategy: StrategyLibraryItem) => boolean
  showContactsTab?: boolean
  onOpenStrategy: (id: string) => void
  onMoreStrategy: (id: string) => void
  onDeleteStrategy?: (id: string) => void
  onHideStrategy?: (id: string) => void
  onRestoreStrategy: (id: string) => void
  onToggleSelected: (id: string) => void
  onTabChange: (tab: 'library' | 'contacts') => void
  onAddCustomStrategy: () => void
}

interface StrategyListProps {
  isSelected: boolean
  openActionsId: string | null
  strategies: readonly StrategyLibraryItem[]
  onCloseActions: () => void
  canOpenStrategy: (strategy: StrategyLibraryItem) => boolean
  onOpenActions: (id: string, trigger: HTMLButtonElement) => void
  onOpenStrategy: (id: string) => void
  onMoreStrategy: (id: string) => void
  onRequestDelete?: (strategy: StrategyLibraryItem) => void
  onHideStrategy?: (id: string) => void
  onToggleSelected: (id: string) => void
}

function StrategyList({
  isSelected,
  openActionsId,
  strategies,
  onCloseActions,
  canOpenStrategy,
  onOpenActions,
  onOpenStrategy,
  onMoreStrategy,
  onRequestDelete,
  onHideStrategy,
  onToggleSelected,
}: StrategyListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {strategies.map((strategy) => (
        <li key={strategy.id} className="relative">
          {strategy.kind === 'catalog' ? (
            <StrategyCard
              kind="catalog"
              title={strategy.title}
              sub={strategy.sub}
              {...(canOpenStrategy(strategy)
                ? {
                    onOpen: () => {
                      onOpenStrategy(strategy.id)
                    },
                  }
                : {})}
              onMore={(trigger) => {
                onMoreStrategy(strategy.id)
                onOpenActions(strategy.id, trigger)
              }}
            />
          ) : (
            <StrategyCard
              kind="custom"
              title={strategy.title}
              {...(strategy.sub === undefined ? {} : { sub: strategy.sub })}
              {...(canOpenStrategy(strategy)
                ? {
                    onOpen: () => {
                      onOpenStrategy(strategy.id)
                    },
                  }
                : {})}
              onMore={(trigger) => {
                onMoreStrategy(strategy.id)
                onOpenActions(strategy.id, trigger)
              }}
            />
          )}
          {openActionsId === strategy.id ? (
            <StrategyActionDialog
              context="visible"
              title={strategy.title}
              kind={strategy.kind}
              isSelected={isSelected}
              onClose={onCloseActions}
              {...(onRequestDelete === undefined
                ? {}
                : {
                    onRequestDelete: () => {
                      onRequestDelete(strategy)
                    },
                  })}
              {...(onHideStrategy === undefined
                ? {}
                : {
                    onHide: () => {
                      onHideStrategy(strategy.id)
                    },
                  })}
              onToggleSelected={() => {
                onToggleSelected(strategy.id)
              }}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

interface HiddenStrategyListProps {
  openActionsId: string | null
  strategies: readonly StrategyLibraryItem[]
  onCloseActions: () => void
  onOpenActions: (id: string, trigger: HTMLButtonElement) => void
  onOpenStrategy: (id: string) => void
  onMoreStrategy: (id: string) => void
  onRequestDelete: (strategy: StrategyLibraryItem) => void
  onRestoreStrategy: (id: string) => void
}

function HiddenStrategyList({
  openActionsId,
  strategies,
  onCloseActions,
  onOpenActions,
  onOpenStrategy,
  onMoreStrategy,
  onRequestDelete,
  onRestoreStrategy,
}: HiddenStrategyListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {strategies.map((strategy) => (
        <li key={strategy.id} className="relative">
          {strategy.kind === 'catalog' ? (
            <StrategyCard
              kind="catalog"
              title={strategy.title}
              sub={strategy.sub}
              onOpen={() => {
                onOpenStrategy(strategy.id)
              }}
              onMore={(trigger) => {
                onMoreStrategy(strategy.id)
                onOpenActions(strategy.id, trigger)
              }}
            />
          ) : (
            <StrategyCard
              kind="custom"
              title={strategy.title}
              {...(strategy.sub === undefined ? {} : { sub: strategy.sub })}
              onOpen={() => {
                onOpenStrategy(strategy.id)
              }}
              onMore={(trigger) => {
                onMoreStrategy(strategy.id)
                onOpenActions(strategy.id, trigger)
              }}
            />
          )}
          {openActionsId === strategy.id ? (
            <StrategyActionDialog
              context="hidden"
              title={strategy.title}
              kind={strategy.kind}
              onClose={onCloseActions}
              onRequestDelete={() => {
                onRequestDelete(strategy)
              }}
              onRestore={() => {
                onRestoreStrategy(strategy.id)
              }}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function StrategyLibraryScreen({
  selectedStrategies,
  otherStrategies,
  hiddenStrategies,
  customStrategyCount,
  nav,
  canOpenStrategy = () => true,
  showContactsTab = true,
  onOpenStrategy,
  onMoreStrategy,
  onDeleteStrategy,
  onHideStrategy,
  onRestoreStrategy,
  onToggleSelected,
  onTabChange,
  onAddCustomStrategy,
}: StrategyLibraryScreenProps) {
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<
    Extract<StrategyLibraryItem, { kind: 'custom' }> | undefined
  >()
  const [showHiddenStrategies, setShowHiddenStrategies] = useState(false)
  const [showCustomStrategyLimit, setShowCustomStrategyLimit] = useState(false)
  const actionsTriggerRef = useRef<HTMLButtonElement>(null)
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null)

  function closeActions() {
    actionsTriggerRef.current?.focus()
    setOpenActionsId(null)
  }

  function requestDelete(strategy: StrategyLibraryItem) {
    if (strategy.kind !== 'custom') return

    setOpenActionsId(null)
    setDeleteCandidate(strategy)
  }

  function cancelDelete() {
    setDeleteCandidate(undefined)
    actionsTriggerRef.current?.focus()
  }

  return (
    <Screen contentClassName="gap-4 pb-6" nav={nav}>
      <h1 className="type-display">Knihovna strategií</h1>

      <p className="text-muted text-[0.9375rem] leading-[1.375rem]">
        Vyberte si kroky, které chcete mít po ruce. Můžete si je v klidné chvíli projít a později
        použít i bez otevření aplikace.
      </p>

      {showContactsTab ? <StrategyTabs activeTab="library" onChange={onTabChange} /> : null}

      {selectedStrategies.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="selected-strategies-heading">
          <h2
            ref={selectedHeadingRef}
            id="selected-strategies-heading"
            tabIndex={-1}
            className="type-h2 focus:outline-none"
          >
            Vybrané
          </h2>
          <StrategyList
            isSelected
            openActionsId={openActionsId}
            strategies={selectedStrategies}
            onCloseActions={closeActions}
            canOpenStrategy={canOpenStrategy}
            onOpenActions={(id, trigger) => {
              actionsTriggerRef.current = trigger
              setOpenActionsId(id)
            }}
            onOpenStrategy={onOpenStrategy}
            onMoreStrategy={onMoreStrategy}
            {...(onDeleteStrategy === undefined ? {} : { onRequestDelete: requestDelete })}
            {...(onHideStrategy === undefined ? {} : { onHideStrategy })}
            onToggleSelected={onToggleSelected}
          />
        </section>
      ) : null}

      {otherStrategies.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="other-strategies-heading">
          <h2 id="other-strategies-heading" className="type-h2">
            Další strategie
          </h2>
          <StrategyList
            isSelected={false}
            openActionsId={openActionsId}
            strategies={otherStrategies}
            onCloseActions={closeActions}
            canOpenStrategy={canOpenStrategy}
            onOpenActions={(id, trigger) => {
              actionsTriggerRef.current = trigger
              setOpenActionsId(id)
            }}
            onOpenStrategy={onOpenStrategy}
            onMoreStrategy={onMoreStrategy}
            {...(onDeleteStrategy === undefined ? {} : { onRequestDelete: requestDelete })}
            {...(onHideStrategy === undefined ? {} : { onHideStrategy })}
            onToggleSelected={onToggleSelected}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-1.5 pt-2">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            if (customStrategyCount >= MAX_CUSTOM_STRATEGIES) {
              setShowCustomStrategyLimit(true)
            } else {
              onAddCustomStrategy()
            }
          }}
        >
          Přidat vlastní strategii
        </Button>
        <p className="type-body-sm text-faint text-center">
          {customStrategyCount} z {MAX_CUSTOM_STRATEGIES} vlastních strategií
        </p>
      </div>

      {hiddenStrategies.length > 0 ? (
        <>
          <button
            type="button"
            className="type-label text-brand-ink min-h-11 text-center"
            aria-expanded={showHiddenStrategies}
            aria-controls="hidden-strategies"
            onClick={() => {
              setShowHiddenStrategies((current) => !current)
            }}
          >
            {showHiddenStrategies ? '↑' : '↓'} Skryté strategie
          </button>

          {showHiddenStrategies ? (
            <section
              id="hidden-strategies"
              className="flex flex-col gap-4 pt-2"
              aria-labelledby="hidden-strategies-heading"
            >
              <h2 id="hidden-strategies-heading" className="type-h2">
                Skryté strategie
              </h2>
              <HiddenStrategyList
                openActionsId={openActionsId}
                strategies={hiddenStrategies}
                onCloseActions={closeActions}
                onOpenActions={(id, trigger) => {
                  actionsTriggerRef.current = trigger
                  setOpenActionsId(id)
                }}
                onOpenStrategy={onOpenStrategy}
                onMoreStrategy={onMoreStrategy}
                onRequestDelete={requestDelete}
                onRestoreStrategy={(id) => {
                  if (hiddenStrategies.length === 1) {
                    setShowHiddenStrategies(false)
                  }
                  onRestoreStrategy(id)
                }}
              />
            </section>
          ) : null}
        </>
      ) : null}

      {deleteCandidate !== undefined ? (
        <DeleteStrategyDialog
          title={deleteCandidate.title}
          onCancel={cancelDelete}
          onConfirm={() => {
            const isLastHiddenStrategy =
              hiddenStrategies.length === 1 &&
              hiddenStrategies.some((strategy) => strategy.id === deleteCandidate.id)

            if (isLastHiddenStrategy) {
              setShowHiddenStrategies(false)
            }

            onDeleteStrategy?.(deleteCandidate.id)
            setDeleteCandidate(undefined)
          }}
        />
      ) : null}

      {showCustomStrategyLimit ? (
        <CustomStrategyLimitDialog
          onClose={() => {
            setShowCustomStrategyLimit(false)
          }}
          onShowStrategies={() => {
            setShowCustomStrategyLimit(false)
            selectedHeadingRef.current?.focus()
            selectedHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      ) : null}
    </Screen>
  )
}
