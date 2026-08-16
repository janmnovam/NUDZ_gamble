import { useState } from 'react'

import {
  CatalogStrategyDetailScreen,
  type CatalogStrategyDetail,
} from '@ui/coping/CatalogStrategyDetailScreen.tsx'
import {
  CustomStrategyDetailScreen,
  type CustomStrategyChanges,
} from '@ui/coping/CustomStrategyDetailScreen.tsx'
import { type StrategyContactItem } from '@ui/coping/components/ContactCard.tsx'
import { StrategyContactsScreen } from '@ui/coping/StrategyContactsScreen.tsx'
import {
  StrategyLibraryScreen,
  type StrategyLibraryItem,
} from '@ui/coping/StrategyLibraryScreen.tsx'

interface StrategySectionProps {
  contacts: readonly StrategyContactItem[]
  catalogStrategyDetails: readonly CatalogStrategyDetail[]
  selectedStrategies: readonly StrategyLibraryItem[]
  otherStrategies: readonly StrategyLibraryItem[]
  hiddenStrategies: readonly StrategyLibraryItem[]
  onOpenStrategy: (id: string) => void
  onMoreStrategy: (id: string) => void
  onDeleteStrategy: (id: string) => void
  onHideStrategy: (id: string) => void
  onRestoreStrategy: (id: string) => void
  onToggleSelected: (id: string) => void
  onUpdateCustomStrategy: (id: string, changes: CustomStrategyChanges) => void
  onCreateCustomStrategy: (changes: CustomStrategyChanges) => void
}

export function StrategySection({
  contacts,
  catalogStrategyDetails,
  selectedStrategies,
  otherStrategies,
  hiddenStrategies,
  onOpenStrategy,
  onMoreStrategy,
  onDeleteStrategy,
  onHideStrategy,
  onRestoreStrategy,
  onToggleSelected,
  onUpdateCustomStrategy,
  onCreateCustomStrategy,
}: StrategySectionProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'contacts'>('library')
  const [activeCatalogStrategyId, setActiveCatalogStrategyId] = useState<string>()
  const [activeCustomStrategyId, setActiveCustomStrategyId] = useState<string>()
  const [isCreatingCustomStrategy, setIsCreatingCustomStrategy] = useState(false)
  const allStrategies = [...selectedStrategies, ...otherStrategies, ...hiddenStrategies]
  const activeCatalogStrategy = catalogStrategyDetails.find(
    (strategy) => strategy.id === activeCatalogStrategyId,
  )
  const activeCustomStrategy = allStrategies.find(
    (strategy) => strategy.id === activeCustomStrategyId && strategy.kind === 'custom',
  )
  const customStrategyCount = allStrategies.filter((strategy) => strategy.kind === 'custom').length

  if (isCreatingCustomStrategy) {
    return (
      <CustomStrategyDetailScreen
        mode="create"
        existingStrategyTitles={allStrategies.map((strategy) => strategy.title)}
        onBack={() => {
          setIsCreatingCustomStrategy(false)
        }}
        onSave={(changes) => {
          onCreateCustomStrategy(changes)
          setIsCreatingCustomStrategy(false)
        }}
      />
    )
  }

  if (activeCustomStrategy?.kind === 'custom') {
    return (
      <CustomStrategyDetailScreen
        mode="edit"
        strategy={activeCustomStrategy}
        existingStrategyTitles={allStrategies
          .filter((strategy) => strategy.id !== activeCustomStrategy.id)
          .map((strategy) => strategy.title)}
        onBack={() => {
          setActiveCustomStrategyId(undefined)
        }}
        onSave={(changes) => {
          onUpdateCustomStrategy(activeCustomStrategy.id, changes)
          setActiveCustomStrategyId(undefined)
        }}
      />
    )
  }

  if (activeCatalogStrategy !== undefined) {
    return (
      <CatalogStrategyDetailScreen
        detail={activeCatalogStrategy}
        onBack={() => {
          setActiveCatalogStrategyId(undefined)
        }}
      />
    )
  }

  if (activeTab === 'contacts') {
    return <StrategyContactsScreen contacts={contacts} onTabChange={setActiveTab} />
  }

  return (
    <StrategyLibraryScreen
      selectedStrategies={selectedStrategies}
      otherStrategies={otherStrategies}
      hiddenStrategies={hiddenStrategies}
      customStrategyCount={customStrategyCount}
      onOpenStrategy={(id) => {
        onOpenStrategy(id)

        const strategy = allStrategies.find((item) => item.id === id)

        if (strategy?.kind === 'custom') {
          setActiveCustomStrategyId(id)
        } else if (catalogStrategyDetails.some((detail) => detail.id === id)) {
          setActiveCatalogStrategyId(id)
        }
      }}
      onMoreStrategy={onMoreStrategy}
      onDeleteStrategy={onDeleteStrategy}
      onHideStrategy={onHideStrategy}
      onRestoreStrategy={onRestoreStrategy}
      onToggleSelected={onToggleSelected}
      onTabChange={setActiveTab}
      onAddCustomStrategy={() => {
        setIsCreatingCustomStrategy(true)
      }}
    />
  )
}
