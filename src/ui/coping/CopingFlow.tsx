import { useEffect, useState } from 'react'

import type { ContactDto } from '@/app/dto/contact.ts'
import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { type StrategyContactItem } from '@ui/coping/components/ContactCard.tsx'
import { type CustomStrategyChanges } from '@ui/coping/CustomStrategyDetailScreen.tsx'
import { type StrategyLibraryItem } from '@ui/coping/StrategyLibraryScreen.tsx'
import { StrategySection } from '@ui/coping/StrategySection.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { useContactService, useCopingService } from '@ui/app/AppContext.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
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
    : {
        id: strategy.id,
        kind: 'custom',
        title: strategy.label,
        ...(strategy.howToStart === null ? {} : { sub: strategy.howToStart }),
        ...(strategy.whenToUse === null ? {} : { whenToUse: strategy.whenToUse }),
      }
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
  const userId = useCurrentUser((s) => s.userId)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [suggestions, setSuggestions] = useState<CopingSuggestionDto[]>([])
  const [contacts, setContacts] = useState<ContactDto[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (userId === null) return
    let cancelled = false

    void copingService.list(userId, clientNow()).then((res) => {
      if (cancelled) return
      if (res.error || !res.data) {
        console.error('[coping] list failed', res.error)
        setState({ status: 'failed' })
        return
      }
      setState({ status: 'ready', strategies: res.data })
    })

    return () => {
      cancelled = true
    }
  }, [copingService, userId, reloadToken])

  useEffect(() => {
    let cancelled = false

    void Promise.allSettled([
      copingService.getSuggestions(clientNow()),
      contactService.list(),
    ]).then(([suggestionsResult, contactsResult]) => {
      if (suggestionsResult.status === 'rejected') {
        console.error('[coping] suggestions failed', suggestionsResult.reason)
      } else if (suggestionsResult.value.error || !suggestionsResult.value.data) {
        console.error('[coping] suggestions failed', suggestionsResult.value.error)
      } else if (!cancelled) {
        setSuggestions(suggestionsResult.value.data)
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
    if (userId === null) return
    void copingService.toggle(copingStrategyId, active, userId, clientNow()).then((res) => {
      if (res.error) console.error('[coping] toggle failed', res.error)
      else reload()
    })
  }

  const handleAdd = (changes: CustomStrategyChanges) => {
    if (userId === null) return
    void copingService
      .create(
        { label: changes.title, whenToUse: changes.whenToUse, howToStart: changes.howToStart },
        userId,
        clientNow(),
      )
      .then((res) => {
        if (res.error) console.error('[coping] create failed', res.error)
        else reload()
      })
  }

  const handleUpdate = (copingStrategyId: string, changes: CustomStrategyChanges) => {
    if (userId === null) return
    void copingService
      .update(
        copingStrategyId,
        { label: changes.title, whenToUse: changes.whenToUse, howToStart: changes.howToStart },
        userId,
        clientNow(),
      )
      .then((res) => {
        if (res.error) console.error('[coping] update failed', res.error)
        else reload()
      })
  }

  const handleDelete = (copingStrategyId: string) => {
    if (userId === null) return
    void copingService.remove(copingStrategyId, userId).then((res) => {
      if (res.error) console.error('[coping] delete failed', res.error)
      else reload()
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
      createCustomStrategyFields="full"
      onOpenStrategy={() => undefined}
      onMoreStrategy={() => undefined}
      onRestoreStrategy={() => undefined}
      onToggleSelected={(id) => {
        const strategy = state.strategies.find((item) => item.id === id)
        if (strategy !== undefined) {
          handleToggle(id, !strategy.active)
        }
      }}
      onCreateCustomStrategy={handleAdd}
      onUpdateCustomStrategy={handleUpdate}
      onDeleteStrategy={handleDelete}
    />
  )
}
