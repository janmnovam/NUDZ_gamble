import { useEffect, useState } from 'react'

import { Dashboard } from '@ui/dashboard/Dashboard.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { OnboardingFlow } from '@ui/onboarding/OnboardingFlow.tsx'
import { app } from '@ui/services.ts'

type Screen = 'loading' | 'onboarding' | 'dashboard'

export function App() {
  const [screen, setScreen] = useState<Screen>('loading')

  // Gate onboarding behind a completed-profile check so a returning user
  // (or the seeded demo data) lands straight on the dashboard instead of
  // going through onboarding again.
  useEffect(() => {
    let active = true
    void app.onboarding.getStatus().then(({ completed }) => {
      if (active) setScreen(completed ? 'dashboard' : 'onboarding')
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <I18nProvider>
      {screen === 'loading' ? null : screen === 'onboarding' ? (
        <OnboardingFlow
          onComplete={() => {
            setScreen('dashboard')
          }}
        />
      ) : (
        <Dashboard />
      )}
    </I18nProvider>
  )
}
