import { useEffect, useRef, useState } from 'react'

import { useCopingService, useOnboardingService } from '@ui/app/AppContext.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { DoneStep } from '@ui/onboarding/steps/DoneStep.tsx'
import { IntroStep } from '@ui/onboarding/steps/IntroStep.tsx'
import { RefLimitsStep } from '@ui/onboarding/steps/RefLimitsStep.tsx'
import { RefStakesStep } from '@ui/onboarding/steps/RefStakesStep.tsx'
import { RefTimeStep } from '@ui/onboarding/steps/RefTimeStep.tsx'
import type { CopingDto, SuggestedLimitsResponse } from '@/app/dto/onboarding.ts'
import type { CopingSuggestionDto } from '@/app/dto/coping.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { clientNow } from '@ui/clock.ts'

const TOTAL_STEPS = 6

interface OnboardingFlowProps {
  /** Called when the user acknowledges the final screen (seam to the dashboard). */
  onComplete: () => void
}

/**
 * Light flow shell: owns which onboarding step is shown and the answers collected
 * so far (UI state only), and hands each step its navigation callbacks.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const onboarding = useOnboardingService()
  const coping = useCopingService()
  const rememberInterventionStart = useAdminStore((s) => s.setInterventionStartDate)
  const submittingRef = useRef(false)

  const [step, setStep] = useState(0)
  const [refTimeMinutes, setRefTimeMinutes] = useState(0)
  const [refStakesCzk, setRefStakesCzk] = useState(0)
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null)
  const [stakesLimitCzk, setStakesLimitCzk] = useState<number | null>(null)
  const [suggestedLimits, setSuggestedLimits] = useState<SuggestedLimitsResponse | null>(null)
  const [copingStrategies, setCopingStrategies] = useState<CopingSuggestionDto[]>([])
  const [copingSelected, setCopingSelected] = useState<CopingSuggestionDto[]>([])
  const [customCoping, setCustomCoping] = useState<CopingDto | null>(null)
  const [interventionStartDate, setInterventionStartDate] = useState<Date | null>(null)

  // Load the predefined coping suggestions once; map each to the domain-shaped
  useEffect(() => {
    let active = true
    void coping.getSuggestions(DEMO_USER_ID, clientNow()).then((suggestions) => {
      if (active) setCopingStrategies(suggestions)
    })
    return () => {
      active = false
    }
  }, [coping])

  // Derive the suggested limits and absolute cap from the reference whenever it changes.
  useEffect(() => {
    let active = true
    void onboarding
      .getSuggestedLimits(
        { timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk },
        DEMO_USER_ID,
        clientNow(),
      )
      .then((limits) => {
        if (active) setSuggestedLimits(limits)
      })
    return () => {
      active = false
    }
  }, [onboarding, refTimeMinutes, refStakesCzk])

  const goNext = () => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }
  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
  }

  const resolvedTimeLimit = timeLimitMin ?? suggestedLimits?.timeMinutes ?? 0
  const resolvedStakesLimit = stakesLimitCzk ?? suggestedLimits?.stakesAmount ?? 0
  const copingCount = copingSelected.length + (customCoping ? 1 : 0)

  // Persist via the onboarding service, then confirm.
  const finishSetup = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const res = await onboarding.complete(
        {
          reference: { timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk },
          limits: { timeMinutes: resolvedTimeLimit, stakesAmount: resolvedStakesLimit },
          coping: [...copingSelected, ...(customCoping ? [customCoping] : [])],
        },
        DEMO_USER_ID,
        clientNow(),
      )
      setInterventionStartDate(new Date(res.interventionStartDate))
      rememberInterventionStart(res.interventionStartDate)
      goNext()
    } catch (error) {
      submittingRef.current = false
      console.error('Onboarding completion failed', error)
    }
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
          referenceStakes={refStakesCzk}
          suggestedTimeMinutes={suggestedLimits?.timeMinutes ?? 0}
          suggestedStakesCzk={suggestedLimits?.stakesAmount ?? 0}
          timeCapMinutes={suggestedLimits?.timeCapMinutes ?? 0}
          stakesCapCzk={suggestedLimits?.stakesCapAmount ?? 0}
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
          strategies={copingStrategies}
          selected={copingSelected}
          onSelectedChange={setCopingSelected}
          customCoping={customCoping}
          onCustomCopingChange={setCustomCoping}
          onFinish={() => {
            void finishSetup()
          }}
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
