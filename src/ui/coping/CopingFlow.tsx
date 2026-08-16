import { useEffect, useState } from 'react'

import type { ContactDto } from '@/app/dto/contact.ts'
import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { type StrategyContactItem } from '@ui/coping/components/ContactCard.tsx'
import { type StrategyLibraryItem } from '@ui/coping/StrategyLibraryScreen.tsx'
import { StrategySection } from '@ui/coping/StrategySection.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { useContactService, useCopingService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; strategies: CopingStrategyDto[] }
  | { status: 'failed' }

const NO_CATALOG_DETAILS = [] as const
const NO_HIDDEN_STRATEGIES = [] as const
const CZECH_PHONE_PATTERN = /^(\+420)?(\d{3})(\d{3})(\d{3})$/

function toLibraryItem(
  strategy: CopingStrategyDto,
  summariesByLabel: ReadonlyMap<string, string>,
): StrategyLibraryItem {
  return strategy.type === 'default'
    ? {
        id: strategy.id,
        kind: 'catalog',
        title: strategy.label,
        sub: summariesByLabel.get(strategy.label) ?? '',
      }
    : { id: strategy.id, kind: 'custom', title: strategy.label }
}

function formatPhone(phone: string): string {
  const match = CZECH_PHONE_PATTERN.exec(phone)
  return match === null ? phone : [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ')
}

function toContactItem(contact: ContactDto): StrategyContactItem {
  const meta = [
    contact.phone === null ? undefined : formatPhone(contact.phone),
    contact.availability,
  ]
    .filter((value): value is string => value !== undefined && value !== null)
    .join(' · ')

  return {
    id: contact.id,
    title: contact.name,
    purpose: contact.purpose ?? '',
    ...(meta.length === 0 ? {} : { meta }),
    ...(contact.phone === null ? {} : { phone: contact.phone }),
    ...(contact.url === null ? {} : { url: contact.url }),
  }
}

/**
 * Feature entry point for the "Strategie" tab, matching `DashboardFlow`'s
 * shape: load the list through `CopingStrategyService` and hand it to the
 * (pure) screen. Toggle/add bump `reloadToken` to re-fetch the list from
 * storage afterwards rather than reconciling an optimistic copy, so the
 * screen never drifts from the source of truth.
 */
export function CopingFlow() {
  const { t } = useTranslation()
  const copingService = useCopingService()
  const contactService = useContactService()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [suggestions, setSuggestions] = useState<CopingSuggestionDto[]>([])
  const [contacts, setContacts] = useState<ContactDto[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    void copingService.list(DEMO_USER_ID, clientNow()).then(
      (strategies) => {
        if (!cancelled) setState({ status: 'ready', strategies })
      },
      (error: unknown) => {
        console.error('[coping] list failed', error)
        if (!cancelled) setState({ status: 'failed' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [copingService, reloadToken])

  useEffect(() => {
    let cancelled = false

    void Promise.allSettled([
      copingService.getSuggestions(DEMO_USER_ID, clientNow()),
      contactService.list(),
    ]).then(([suggestionsResult, contactsResult]) => {
      if (suggestionsResult.status === 'rejected') {
        console.error('[coping] suggestions failed', suggestionsResult.reason)
      } else if (!cancelled) {
        setSuggestions(suggestionsResult.value)
      }

      if (contactsResult.status === 'rejected') {
        console.error('[coping] contacts failed', contactsResult.reason)
      } else if (!cancelled) {
        setContacts(contactsResult.value)
      }
    })

    return () => {
      cancelled = true
    }
  }, [contactService, copingService])

  const reload = () => {
    setReloadToken((token) => token + 1)
  }

  const handleToggle = (copingStrategyId: string, active: boolean) => {
    copingService
      .toggle(copingStrategyId, active, DEMO_USER_ID, clientNow())
      .then(reload)
      .catch((error: unknown) => {
        console.error('[coping] toggle failed', error)
      })
  }

  const handleAdd = (label: string) => {
    copingService
      .create({ label }, DEMO_USER_ID, clientNow())
      .then(reload)
      .catch((error: unknown) => {
        console.error('[coping] create failed', error)
      })
  }

  if (state.status !== 'ready') {
    return (
      <Screen nav={<TabBar active="coping" />}>
        <p className="type-body text-muted m-auto text-center">
          {state.status === 'loading' ? t('common.loading') : t('common.error')}
        </p>
      </Screen>
    )
  }

  const selectedStrategies: StrategyLibraryItem[] = []
  const otherStrategies: StrategyLibraryItem[] = []
  const summariesByLabel = new Map<string, string>()
  for (const suggestion of suggestions) {
    if (suggestion.summary !== undefined) {
      summariesByLabel.set(suggestion.label, suggestion.summary)
    }
  }

  for (const strategy of state.strategies) {
    const item = toLibraryItem(strategy, summariesByLabel)
    if (strategy.active) {
      selectedStrategies.push(item)
    } else {
      otherStrategies.push(item)
    }
  }

  return (
    <StrategySection
      contacts={contacts.filter((contact) => contact.category === 'counselling').map(toContactItem)}
      catalogStrategyDetails={NO_CATALOG_DETAILS}
      selectedStrategies={selectedStrategies}
      otherStrategies={otherStrategies}
      hiddenStrategies={NO_HIDDEN_STRATEGIES}
      nav={<TabBar active="coping" />}
      showContactsTab={contacts.some((contact) => contact.category === 'counselling')}
      createCustomStrategyFields="title-only"
      onOpenStrategy={() => undefined}
      onMoreStrategy={() => undefined}
      onRestoreStrategy={() => undefined}
      onToggleSelected={(id) => {
        const strategy = state.strategies.find((item) => item.id === id)
        if (strategy !== undefined) {
          handleToggle(id, !strategy.active)
        }
      }}
      onCreateCustomStrategy={(changes) => {
        handleAdd(changes.title)
      }}
    />
  )
}
