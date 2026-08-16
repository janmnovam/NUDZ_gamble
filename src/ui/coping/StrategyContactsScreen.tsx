import { type ReactNode } from 'react'

import { Screen } from '@ui/components/Screen.tsx'
import { ContactCard, type StrategyContactItem } from '@ui/coping/components/ContactCard.tsx'
import { StrategyTabs } from '@ui/coping/components/StrategyTabs.tsx'

interface StrategyContactsScreenProps {
  contacts: readonly StrategyContactItem[]
  nav?: ReactNode
  onTabChange: (tab: 'library' | 'contacts') => void
}

export function StrategyContactsScreen({
  contacts,
  nav,
  onTabChange,
}: StrategyContactsScreenProps) {
  return (
    <Screen contentClassName="gap-4 pb-6" nav={nav}>
      <h1 className="type-display">Kontakty</h1>

      <p className="text-muted text-[0.9375rem] leading-[1.375rem]">
        Můžete se nezávazně obrátit na odbornou službu. Je na vás, zda a kdy kontakt využijete.
      </p>

      <StrategyTabs activeTab="contacts" onChange={onTabChange} />

      <ul className="flex flex-col gap-4">
        {contacts.map((contact) => (
          <li key={contact.id}>
            <ContactCard contact={contact} />
          </li>
        ))}
      </ul>

      <aside className="border-sunken mt-6 border-t pt-4" aria-labelledby="emergency-heading">
        <h2 id="emergency-heading" className="type-overline text-faint">
          Bezprostřední ohrožení
        </h2>
        <p className="type-body-sm text-muted mt-1">
          Pokud jste v bezprostředním ohrožení života nebo zdraví, volejte 112 nebo 155.
        </p>
      </aside>
    </Screen>
  )
}
