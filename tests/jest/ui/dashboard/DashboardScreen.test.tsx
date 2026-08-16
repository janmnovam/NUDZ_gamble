import { render, screen } from '@testing-library/react'

import type { DashboardResponse } from '@/app/dto/dashboard.ts'
import { DashboardScreen } from '@ui/dashboard/DashboardScreen.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

/** Day 1 of the Figma frame: the spec's reference scenario, nothing recorded. */
const DAY_1: DashboardResponse = {
  studyDay: 1,
  weekNo: 1,
  time: { used: 0, limit: 480, percent: 0, remaining: 480, status: 'OK' },
  stakes: { used: 0, limit: 8000, percent: 0, remaining: 8000, status: 'OK' },
  overallStatus: 'OK',
  days: Array.from({ length: 7 }, (_, index) => ({
    studyDay: index + 1,
    date: `2026-09-0${String(index + 1)}T00:00:00.000Z`,
    state: 'future' as const,
  })),
  missingDays: [],
  pendingAction: 'none',
  cautionThresholdPercent: 80,
}

function renderScreen(overrides: Partial<DashboardResponse> = {}) {
  render(
    <I18nProvider>
      <DashboardScreen dashboard={{ ...DAY_1, ...overrides }} />
    </I18nProvider>,
  )
}

describe('DashboardScreen', () => {
  it('shows the programme day and week', () => {
    renderScreen()
    expect(screen.getByText('Den 1')).not.toBeNull()
    expect(screen.getByText('Týden 1/4')).not.toBeNull()
  })

  it('reads limits back without a zero minutes part', () => {
    renderScreen()
    expect(screen.getByText('zbývá 8 h z 8 h')).not.toBeNull()
    expect(screen.getByText('zbývá 8 000 Kč z 8 000 Kč')).not.toBeNull()
  })

  it('states the status in words, never colour alone', () => {
    renderScreen({ overallStatus: 'PREKROCENO' })
    expect(screen.getByText('PŘEKROČENO')).not.toBeNull()
  })

  it('reports the overage instead of a negative remainder', () => {
    renderScreen({
      stakes: { used: 8640, limit: 8000, percent: 108, remaining: -640, status: 'PREKROCENO' },
    })
    expect(screen.getByText('překročeno o 640 Kč z 8 000 Kč')).not.toBeNull()
  })

  it('hides the percentage when the limit is 0', () => {
    renderScreen({
      time: { used: 0, limit: 0, percent: null, remaining: 0, status: 'OK' },
    })
    expect(screen.getByText('zbývá 0 min z 0 min')).not.toBeNull()
  })

  it('renders seven day cells', () => {
    renderScreen()
    // Non-actionable cells are images; a missing day would be a button.
    expect(screen.getAllByRole('img')).toHaveLength(7)
  })

  it('enables the CTA and shows the backfill banner once a check-in is due', () => {
    render(
      <I18nProvider>
        <DashboardScreen
          dashboard={{
            ...DAY_1,
            studyDay: 3,
            pendingAction: 'checkin_due',
            missingDays: ['2026-09-02T00:00:00.000Z'],
          }}
          onCheckIn={() => undefined}
        />
      </I18nProvider>,
    )
    const cta = screen.getByRole('button', { name: 'Vyplnit check-in' })
    expect((cta as HTMLButtonElement).disabled).toBe(false)
    // Naming the day is the point — "fill in the missing days" told the user
    // neither which day nor how many.
    expect(screen.getByText('Nemáte vyplněný st 2')).not.toBeNull()
  })

  it('confirms when nothing is missing, instead of showing no banner at all', () => {
    renderScreen({ studyDay: 4 })
    expect(screen.getByText('Vše vyplněno')).not.toBeNull()
  })

  it('counts the days when more than one is missing', () => {
    renderScreen({
      studyDay: 4,
      pendingAction: 'checkin_due',
      missingDays: ['2026-09-02T00:00:00.000Z', '2026-09-03T00:00:00.000Z'],
    })
    expect(screen.getByText('Nemáte vyplněné 2 dny')).not.toBeNull()
  })

  it('shows the programme-start notice only on day 1', () => {
    renderScreen()
    expect(screen.getByText('Sebesledování začalo')).not.toBeNull()
    renderScreen({ studyDay: 4 })
    expect(screen.getAllByText('Sebesledování začalo')).toHaveLength(1)
  })

  it('makes a missing day actionable and names its state', () => {
    render(
      <I18nProvider>
        <DashboardScreen
          dashboard={{
            ...DAY_1,
            days: DAY_1.days.map((day, index) =>
              index === 0 ? { ...day, state: 'missing' as const } : day,
            ),
          }}
          onBackfillDay={() => undefined}
        />
      </I18nProvider>,
    )
    expect(screen.getByRole('button', { name: /chybí záznam/ })).not.toBeNull()
  })

  it('keeps the CTA inert on day 1 even when a handler is wired', () => {
    // Regression: gating on the handler alone let day 1 open a check-in for a
    // day that had not happened yet.
    render(
      <I18nProvider>
        <DashboardScreen dashboard={DAY_1} onCheckIn={() => undefined} />
      </I18nProvider>,
    )
    const cta = screen.getByRole('button', { name: 'Check-in bude zítra' })
    expect((cta as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps the CTA inert once every day is filled in', () => {
    render(
      <I18nProvider>
        <DashboardScreen
          dashboard={{ ...DAY_1, studyDay: 4, pendingAction: 'none', missingDays: [] }}
          onCheckIn={() => undefined}
        />
      </I18nProvider>,
    )
    const cta = screen.getByRole('button', { name: 'Check-in bude zítra' })
    expect((cta as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables the CTA while no check-in is due', () => {
    renderScreen()
    const cta = screen.getByRole('button', { name: 'Check-in bude zítra' })
    expect((cta as HTMLButtonElement).disabled).toBe(true)
  })
})
