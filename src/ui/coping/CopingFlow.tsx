import { useEffect, useState } from 'react'

import type { CopingStrategyDto } from '@/app/dto/coping.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { CopingScreen } from '@ui/coping/CopingScreen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { useCopingService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; strategies: CopingStrategyDto[] }
  | { status: 'failed' }

/**
 * Feature entry point for the "Váš Coping" tab, matching `DashboardFlow`'s
 * shape: load the list through `CopingStrategyService` and hand it to the
 * (pure) screen. Toggle/add bump `reloadToken` to re-fetch the list from
 * storage afterwards rather than reconciling an optimistic copy, so the
 * screen never drifts from the source of truth.
 */
export function CopingFlow() {
  const { t } = useTranslation()
  const copingService = useCopingService()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
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

  return <CopingScreen strategies={state.strategies} onToggle={handleToggle} onAdd={handleAdd} />
}
