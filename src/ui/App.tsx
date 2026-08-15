import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { OnboardingFlow } from '@ui/onboarding/OnboardingFlow.tsx'

export function App() {
  return (
    <I18nProvider>
      <OnboardingFlow onComplete={() => null} />
    </I18nProvider>
  )
}
