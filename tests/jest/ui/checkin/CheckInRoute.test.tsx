import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

import { DEMO_USER_ID } from '@/app/constants.ts'
import type { CheckInRequest } from '@/app/dto/checkin.ts'
import type { DashboardResponse } from '@/app/dto/dashboard.ts'
import type { CheckInService } from '@/app/ports/checkInService.ts'
import type { DashboardService } from '@/app/ports/dashboardService.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { CheckInRoute } from '@ui/checkin/CheckInRoute.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const DASHBOARD: DashboardResponse = {
  studyDay: 4,
  weekNo: 1,
  time: { used: 0, limit: 480, percent: 0, remaining: 480, status: 'OK' },
  stakes: { used: 0, limit: 8000, percent: 0, remaining: 8000, status: 'OK' },
  overallStatus: 'OK',
  days: [
    { studyDay: 1, date: '2026-09-01T00:00:00.000Z', state: 'completed' },
    { studyDay: 2, date: '2026-09-02T00:00:00.000Z', state: 'completed' },
    { studyDay: 3, date: '2026-09-03T00:00:00.000Z', state: 'missing' },
    { studyDay: 4, date: '2026-09-04T00:00:00.000Z', state: 'future' },
    { studyDay: 5, date: '2026-09-05T00:00:00.000Z', state: 'future' },
    { studyDay: 6, date: '2026-09-06T00:00:00.000Z', state: 'future' },
    { studyDay: 7, date: '2026-09-07T00:00:00.000Z', state: 'future' },
  ],
  missingDays: ['2026-09-03T00:00:00.000Z'],
  pendingAction: 'checkin_due',
  cautionThresholdPercent: 80,
}

function success(req: CheckInRequest) {
  return {
    ok: true,
    checkIn: {
      checkInId: 'ci-1',
      userId: DEMO_USER_ID,
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
  } as const
}

function renderRoute(checkIn: CheckInService, onComplete = jest.fn()) {
  const dashboard: DashboardService = {
    getDashboard: () => Promise.resolve(DASHBOARD),
  }
  render(
    <I18nProvider>
      <AppProvider app={{ dashboard, checkIn } as App}>
        <CheckInRoute onComplete={onComplete} onCancel={jest.fn()} />
      </AppProvider>
    </I18nProvider>,
  )
  return { onComplete }
}

describe('CheckInRoute', () => {
  it('submits a not-played check-in as zeros and completes', async () => {
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      submitCheckIn,
      editCheckIn: () => Promise.reject(new Error('unused')),
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
      DEMO_USER_ID,
      expect.any(String),
    )
  })

  it('submits played time and stakes through CheckInService', async () => {
    const submitCheckIn = jest.fn<CheckInService['submitCheckIn']>((req) =>
      Promise.resolve(success(req)),
    )
    const { onComplete } = renderRoute({
      submitCheckIn,
      editCheckIn: () => Promise.reject(new Error('unused')),
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
      DEMO_USER_ID,
      expect.any(String),
    )
  })
})
