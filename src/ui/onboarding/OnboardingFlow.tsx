import { useState } from 'react'

import { MOCK_COPING_STRATEGIES } from '@ui/onboarding/mockCopingStrategies.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { IntroStep } from '@ui/onboarding/steps/IntroStep.tsx'
import { RefLimitsStep } from '@ui/onboarding/steps/RefLimitsStep.tsx'
import { RefStakesStep } from '@ui/onboarding/steps/RefStakesStep.tsx'
import { RefTimeStep } from '@ui/onboarding/steps/RefTimeStep.tsx'
import { StepPlaceholder } from '@ui/onboarding/steps/StepPlaceholder.tsx'

/** Onboarding has six steps (Figma "01 · Onboarding" section). */
const TOTAL_STEPS = 6

/**
 * Light flow shell: owns which onboarding step is shown and the answers collected
 * so far (UI state only), and hands each step its navigation callbacks. Steps
 * without a real screen yet render a placeholder.
 */
export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [refTimeMinutes, setRefTimeMinutes] = useState(0)
  const [refStakesCzk, setRefStakesCzk] = useState(0)
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null)
  const [stakesLimitCzk, setStakesLimitCzk] = useState<number | null>(null)
  const [copingSelected, setCopingSelected] = useState<string[]>([])
  const [customStrategy, setCustomStrategy] = useState('')

  const goNext = () => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }
  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
  }

  switch (step) {
    case 0:
      return <IntroStep onNext={goNext} />
    case 1:
      return (
        <RefTimeStep
          minutes={refTimeMinutes}
          onMinutesChange={setRefTimeMinutes}
          onNext={goNext}
          onBack={goBack}
        />
      )
    case 2:
      return (
        <RefStakesStep
          stakes={refStakesCzk}
          onStakesChange={setRefStakesCzk}
          onNext={goNext}
          onBack={goBack}
        />
      )
    case 3:
      return (
        <RefLimitsStep
          referenceMinutes={refTimeMinutes}
          referenceStakes={refStakesCzk}
          timeLimit={timeLimitMin}
          stakesLimit={stakesLimitCzk}
          onTimeLimitChange={setTimeLimitMin}
          onStakesLimitChange={setStakesLimitCzk}
          onNext={goNext}
          onBack={goBack}
        />
      )
    case 4:
      return (
        <CopingStep
          options={MOCK_COPING_STRATEGIES}
          selected={copingSelected}
          onSelectedChange={setCopingSelected}
          customStrategy={customStrategy}
          onCustomStrategyChange={setCustomStrategy}
          onFinish={goNext}
          onBack={goBack}
        />
      )
    default:
      return <StepPlaceholder onBack={goBack} />
  }
}
