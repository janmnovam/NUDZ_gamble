import { render } from '@testing-library/react'

import type { OnboardingService } from '@/app/ports/onboardingService.ts'
import { ok } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { useOnboardingService } from '@ui/app/AppContext.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'

const onboarding: OnboardingService = {
  getStatus: () => Promise.resolve(ok({ userId: null, completed: false, completedAt: null })),
  getSuggestedLimits: () =>
    Promise.resolve(
      ok({
        timeMinutes: 0,
        stakesAmount: 0,
        timePercent: 80,
        stakePercent: 80,
        timeCapMinutes: 0,
        stakesCapAmount: 0,
        capPercent: 90,
      }),
    ),
  complete: () =>
    Promise.resolve(
      ok({
        userId: 'u1',
        reference: { timeMinutes: 0, stakesAmount: 0 },
        limits: { timeMinutes: 0, stakesAmount: 0 },
        coping: [],
        interventionStartDate: '2026-01-01',
      }),
    ),
}

// Only the onboarding seam is exercised here; the other services are irrelevant
// to what AppProvider must expose, so a narrowed cast keeps the fake focused.
const fakeApp = { onboarding } as App

function Probe({ report }: { report: (service: OnboardingService) => void }) {
  report(useOnboardingService())
  return null
}

describe('AppProvider / useOnboardingService', () => {
  it('provides the injected app’s onboarding service', () => {
    let received: OnboardingService | undefined
    render(
      <AppProvider app={fakeApp}>
        <Probe
          report={(service) => {
            received = service
          }}
        />
      </AppProvider>,
    )
    expect(received).toBe(onboarding)
  })
})
