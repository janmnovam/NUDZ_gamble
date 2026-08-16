import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { CheckInRequest } from '@/app/dto/checkin.ts'
import type { DashboardResponse } from '@/app/dto/dashboard.ts'
import type { CheckInService } from '@/app/ports/checkInService.ts'
import type { DashboardService } from '@/app/ports/dashboardService.ts'
import { fail, ok } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { CheckInRoute } from '@ui/checkin/CheckInRoute.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const USER_ID = 'test-user'

const DASHBOARD: DashboardResponse = {
  studyDay: 4,
  weekNo: 1,
  time: { used: 0, limit: 480, percent: 0, remaining: 480, status: 'OK' },
  stakes: { used: 0, limit: 8000, percent: 0, remaining: 8000, status: 'OK' },
  overallStatus: 'OK',
  days: [
    { studyDay: 1, date: '2026-09-01T00:00:00.000Z', state: 'completed', backfillable: false },
    { studyDay: 2, date: '2026-09-02T00:00:00.000Z', state: 'completed', backfillable: false },
    { studyDay: 3, date: '2026-09-03T00:00:00.000Z', state: 'missing', backfillable: true },
    { studyDay: 4, date: '2026-09-04T00:00:00.000Z', state: 'future', backfillable: false },
    { studyDay: 5, date: '2026-09-05T00:00:00.000Z', state: 'future', backfillable: false },
    { studyDay: 6, date: '2026-09-06T00:00:00.000Z', state: 'future', backfillable: false },
    { studyDay: 7, date: '2026-09-07T00:00:00.000Z', state: 'future', backfillable: false },
  ],
  missingDays: ['2026-09-03T00:00:00.000Z'],
  pendingAction: 'checkin_due',
  cautionThresholdPercent: 80,
}

const NO_MISSING_DASHBOARD: DashboardResponse = {
  ...DASHBOARD,
  days: DASHBOARD.days.map((day) =>
    day.studyDay === 3 ? { ...day, state: 'completed' as const } : day,
  ),
  missingDays: [],
  pendingAction: 'none',
}

const WAITING_DASHBOARD: DashboardResponse = {
  ...DASHBOARD,
  studyDay: 0,
  days: DASHBOARD.days.map((day) => ({ ...day, state: 'future' as const })),
  missingDays: [],
  pendingAction: 'none',
}

const DAY_2_DASHBOARD: DashboardResponse = {
  ...DASHBOARD,
  studyDay: 2,
  days: DASHBOARD.days.map((day) =>
    day.studyDay === 1
      ? { ...day, state: 'missing' as const }
      : { ...day, state: 'future' as const },
  ),
  missingDays: ['2026-09-01T00:00:00.000Z'],
  pendingAction: 'checkin_due',
}

function success(req: CheckInRequest) {
  return ok({
    ok: true,
    checkIn: {
      checkInId: 'ci-1',
      userId: USER_ID,
      behaviorDate: req.behaviorDate,
      weekNo: 1,
      played: req.played,
      timeMin: req.timeMin,
      stakesCzk: req.stakesCzk,
      winningsCzk: req.winningsCzk,
      submittedAt: '2026-09-04T10:00:00+02:00',
      updatedAt: null,
    },
    feedback: {
      weekNo: 1,
      time: { used: req.timeMin, limit: 480, percent: 0, remaining: 480, status: 'OK' },
      stakes: { used: req.stakesCzk, limit: 8000, percent: 0, remaining: 8000, status: 'OK' },
      overall: 'OK',
      copingReminder: null,
      incompleteWeek: false,
    },
    backfilled: false,
  } as const)
}

function defaultDashboardService(): DashboardService {
  return {
    getDashboard: () => Promise.resolve(ok(DASHBOARD)),
  }
}

function renderRoute({
  checkIn,
  dashboard = defaultDashboardService(),
  onComplete = jest.fn(),
  behaviorDate,
}: {
  checkIn: CheckInService
  dashboard?: DashboardService
  onComplete?: jest.Mock
  behaviorDate?: string
}) {
  useCurrentUser.setState({ userId: USER_ID })
  render(
    <I18nProvider>
      <AppProvider app={{ dashboard, checkIn } as App}>
        <CheckInRoute
          onComplete={onComplete}
          onCancel={jest.fn()}
          {...(behaviorDate ? { behaviorDate } : {})}
        />
      </AppProvider>
    </I18nProvider>,
  )
  return { onComplete }
}

describe('CheckInRoute', () => {
  afterEach(() => {
    cleanup()
    useAdminStore.setState({
      panelOpen: false,
      simulatedTime: null,
      interventionStartDate: null,
    })
    useCurrentUser.setState({ userId: null })
  })

  it('submits a not-played check-in as zeros and completes', async () => {
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(submitCheckIn).toHaveBeenCalledWith(
      {
        behaviorDate: '2026-09-03T00:00:00.000Z',
        played: false,
        timeMin: 0,
        stakesCzk: 0,
        winningsCzk: 0,
      },
      USER_ID,
      expect.any(String),
    )
  })

  it('submits played time and stakes through CheckInService', async () => {
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ano\s+hrál jsem/ }))
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Hodiny' }), { key: 'ArrowDown' })
    fireEvent.change(screen.getByLabelText('Sázky'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(submitCheckIn).toHaveBeenCalledWith(
      {
        behaviorDate: '2026-09-03T00:00:00.000Z',
        played: true,
        timeMin: 60,
        stakesCzk: 2500,
        winningsCzk: 0,
      },
      USER_ID,
      expect.any(String),
    )
  })

  it('opens the previous day for temporary manual testing when no check-in is due', async () => {
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
      dashboard: {
        getDashboard: () => Promise.resolve(ok(NO_MISSING_DASHBOARD)),
      },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(submitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        behaviorDate: '2026-09-03T00:00:00.000Z',
        played: false,
      }),
      USER_ID,
      expect.any(String),
    )
  })

  it('advances the route clock for temporary testing before the first check-in is due', async () => {
    useAdminStore.setState({ interventionStartDate: '2026-09-01T00:00:00.000Z' })
    let dashboardCall = 0
    const getDashboard = jest.fn<DashboardService['getDashboard']>(() => {
      dashboardCall += 1
      return Promise.resolve(ok(dashboardCall === 1 ? WAITING_DASHBOARD : DAY_2_DASHBOARD))
    })
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
      dashboard: { getDashboard },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(getDashboard).toHaveBeenCalledTimes(2)
    expect(submitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        behaviorDate: '2026-09-01T00:00:00.000Z',
        played: false,
      }),
      USER_ID,
      getDashboard.mock.calls[1]?.[1],
    )
  })

  it('opens the exact day named by the behaviorDate prop, overriding the auto-pick', async () => {
    // Auto-pick would choose day 3 (the missing day); the prop names day 2.
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
      behaviorDate: '2026-09-02T00:00:00.000Z',
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(submitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ behaviorDate: '2026-09-02T00:00:00.000Z' }),
      USER_ID,
      expect.any(String),
    )
  })

  it('surfaces an OUTSIDE_WINDOW refusal as a localized message', async () => {
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>(() =>
      Promise.resolve(fail({ type: 'validation', code: 'CHECKIN_OUTSIDE_WINDOW', trace: 'test' })),
    )
    renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
      behaviorDate: '2026-09-03T00:00:00.000Z',
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    expect(
      await screen.findByText(
        'Tento den už zpětně doplnit nejde – doplnit lze jen posledních 5 dní.',
      ),
    ).not.toBeNull()
    logged.mockRestore()
  })

  it('uses the admin simulated time when opening from the dashboard', async () => {
    const simulatedTime = '2026-09-04T10:00:00+02:00'
    useAdminStore.setState({ simulatedTime })
    const getDashboard = jest.fn<DashboardService['getDashboard']>(() =>
      Promise.resolve(ok(DASHBOARD)),
    )
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      checkIn: {
        submitCheckIn,
        editCheckIn: () => Promise.reject(new Error('unused')),
      },
      dashboard: { getDashboard },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Ne\s+nehrál jsem/ }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(getDashboard).toHaveBeenCalledWith(USER_ID, simulatedTime)
    expect(submitCheckIn).toHaveBeenCalledWith(expect.any(Object), USER_ID, simulatedTime)
  })
})
