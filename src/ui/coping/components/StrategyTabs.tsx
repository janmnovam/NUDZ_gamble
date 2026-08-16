type StrategyTab = 'library' | 'contacts'

interface StrategyTabsProps {
  activeTab: StrategyTab
  onChange: (tab: StrategyTab) => void
}

const TABS: readonly { id: StrategyTab; label: string }[] = [
  { id: 'library', label: 'Knihovna' },
  { id: 'contacts', label: 'Kontakty' },
]

export function StrategyTabs({ activeTab, onChange }: StrategyTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Sekce strategií"
      className="bg-sunken flex gap-1 rounded-full p-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`type-label-lg min-w-0 flex-1 rounded-full px-4 py-2 ${
              isActive ? 'bg-surface text-ink' : 'text-muted'
            }`}
            onClick={() => {
              onChange(tab.id)
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
