import { useState } from 'react'

import { completeOnboarding } from '@ui/onboarding/completeOnboarding.ts'
import { suggestedFromReference } from '@ui/onboarding/deriveLimits.ts'
import { MOCK_COPING_STRATEGIES } from '@ui/onboarding/mockCopingStrategies.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { DoneStep } from '@ui/onboarding/steps/DoneStep.tsx'
import { IntroStep } from '@ui/onboarding/steps/IntroStep.tsx'
import { RefLimitsStep } from '@ui/onboarding/steps/RefLimitsStep.tsx'
import { RefStakesStep } from '@ui/onboarding/steps/RefStakesStep.tsx'
import { RefTimeStep } from '@ui/onboarding/steps/RefTimeStep.tsx'

const TOTAL_STEPS = 5;

interface OnboardingFlowProps {
  /** Called when the user acknowledges the final screen (seam to the dashboard). */
  onComplete: () => void
}

/**
 * Light flow shell: owns which onboarding step is shown and the answers collected
 * so far (UI state only), and hands each step its navigation callbacks.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [refTimeMinutes, setRefTimeMinutes] = useState(0)
  const [refStakesCzk, setRefStakesCzk] = useState(0)
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null)
  const [stakesLimitCzk, setStakesLimitCzk] = useState<number | null>(null)
  const [copingSelected, setCopingSelected] = useState<string[]>([])
  const [customStrategy, setCustomStrategy] = useState('')
  const [interventionStartDate, setInterventionStartDate] = useState<Date | null>(null)

  const goNext = () => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }
  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
  }

  const resolvedTimeLimit = timeLimitMin ?? suggestedFromReference(refTimeMinutes)
  const resolvedStakesLimit = stakesLimitCzk ?? suggestedFromReference(refStakesCzk)
  const copingCount = copingSelected.length + (customStrategy.trim().length > 0 ? 1 : 0)

  // Hand the collected answers to the domain, then confirm.
  const finishSetup = () => {
    const { interventionStartDate: startDate } = completeOnboarding({
      referenceTimeMinutes: refTimeMinutes,
      referenceStakesCzk: refStakesCzk,
      timeLimitMinutes: resolvedTimeLimit,
      stakesLimitCzk: resolvedStakesLimit,
      copingStrategyIds: copingSelected,
      customStrategy: customStrategy.trim() || null,
    })
    setInterventionStartDate(startDate)
    goNext()
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
          onFinish={finishSetup}
          onBack={goBack}
        />
      )
    case 5:
      return (
        <DoneStep
          referenceMinutes={refTimeMinutes}
          referenceStakes={refStakesCzk}
          timeLimitMinutes={resolvedTimeLimit}
          stakesLimitCzk={resolvedStakesLimit}
          copingCount={copingCount}
          startDate={interventionStartDate}
          onDone={() => {
            onComplete()
          }}
        />
      )
  }
}
