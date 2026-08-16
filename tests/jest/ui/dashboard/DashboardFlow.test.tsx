import { render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { DashboardResponse } from '@/app/dto/dashboard.ts'
import type { DashboardService } from '@/app/ports/dashboardService.ts'
import { fail, ok, type Result } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { useAppView } from '@ui/app/appView.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { DashboardFlow } from '@ui/dashboard/DashboardFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const DASHBOARD: DashboardResponse = {
  studyDay: 1,
  weekNo: 1,
  time: { used: 0, limit: 480, percent: 0, remaining: 480, status: 'OK' },
  stakes: { used: 0, limit: 8000, percent: 0, remaining: 8000, status: 'OK' },
  overallStatus: 'OK',
  days: Array.from({ length: 7 }, (_, index) => ({
    studyDay: index + 1,
    date: `2026-09-0${String(index + 1)}T00:00:00.000Z`,
    state: 'future' as const,
    backfillable: false,
  })),
  missingDays: [],
  pendingAction: 'none',
  cautionThresholdPercent: 80,
}

// Only the dashboard seam matters here, so a narrowed cast keeps the fake focused.
function renderFlow(dashboard: DashboardService) {
  useCurrentUser.setState({ userId: 'test-user' })
  render(
    <I18nProvider>
      <AppProvider app={{ dashboard } as App}>
        <DashboardFlow />
      </AppProvider>
    </I18nProvider>,
  )
}

describe('DashboardFlow', () => {
  it('shows a loading state until the service resolves', () => {
    // A promise that never settles keeps the flow in its initial state.
    renderFlow({ getDashboard: () => new Promise<Result<DashboardResponse>>(() => undefined) })

    expect(screen.getByText('Načítám…')).not.toBeNull()
  })

  it('renders the dashboard once the service resolves', async () => {
    renderFlow({ getDashboard: () => Promise.resolve(ok(DASHBOARD)) })

    expect(await screen.findByText('Den 1')).not.toBeNull()
    expect(screen.getByText('zbývá 8 h z 8 h')).not.toBeNull()
  })

  it('names the reason when the service returns a known error', async () => {
    // The flow logs the failure; silence it so the run stays readable.
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    renderFlow({
      getDashboard: () =>
        Promise.resolve(fail({ type: 'not_found', code: 'DASHBOARD_NO_PROFILE', trace: 'test' })),
    })

    // "Something went wrong" tells the user nothing they can act on.
    expect(
      await screen.findByText('Nenašli jsme tvůj profil. Dokonči prosím nastavení.'),
    ).not.toBeNull()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })

  it('redirects to the limit prompt when the current week has no limits', async () => {
    useAppView.setState({ view: 'dashboard' })
    renderFlow({
      getDashboard: () =>
        Promise.resolve(fail({ type: 'not_found', code: 'DASHBOARD_NO_LIMIT', trace: 'test' })),
    })

    // No error is shown; the flow routes to the start-of-week limit prompt.
    await waitFor(() => {
      expect(useAppView.getState().view).toBe('review')
    })
  })

  it('falls back to a generic message for an unrecognised error', async () => {
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    renderFlow({
      getDashboard: () =>
        Promise.resolve(fail({ type: 'internal', code: 'SOMETHING_NEW', trace: 'test' })),
    })

    expect(await screen.findByText('Něco se nepovedlo. Zkus to prosím znovu.')).not.toBeNull()
    logged.mockRestore()
  })

  it('does not render the screen while loading', async () => {
    renderFlow({ getDashboard: () => Promise.resolve(ok(DASHBOARD)) })

    expect(screen.queryByText('Celkový stav')).toBeNull()
    await waitFor(() => {
      expect(screen.getByText('Celkový stav')).not.toBeNull()
    })
  })
})
