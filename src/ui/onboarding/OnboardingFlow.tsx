import { useEffect, useState } from 'react'

import { type CopingSuggestionDto } from '@/app/dto/coping.ts'
import { type SuggestedLimitsResponse } from '@/app/dto/onboarding.ts'
import { clientNow } from '@ui/clock.ts'
import { app } from '@ui/services.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { DoneStep } from '@ui/onboarding/steps/DoneStep.tsx'
import { IntroStep } from '@ui/onboarding/steps/IntroStep.tsx'
import { RefLimitsStep } from '@ui/onboarding/steps/RefLimitsStep.tsx'
import { RefStakesStep } from '@ui/onboarding/steps/RefStakesStep.tsx'
import { RefTimeStep } from '@ui/onboarding/steps/RefTimeStep.tsx'

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
  const [step, setStep] = useState(0)
  const [refTimeMinutes, setRefTimeMinutes] = useState(0)
  const [refStakesCzk, setRefStakesCzk] = useState(0)
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null)
  const [stakesLimitCzk, setStakesLimitCzk] = useState<number | null>(null)
  const [copingSelected, setCopingSelected] = useState<string[]>([])
  const [copingOptions, setCopingOptions] = useState<CopingSuggestionDto[]>([])
  const [customStrategy, setCustomStrategy] = useState('')
  const [suggestedLimits, setSuggestedLimits] = useState<SuggestedLimitsResponse | null>(null)
  const [interventionStartDate, setInterventionStartDate] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Load the predefined coping suggestions from the service once.
  useEffect(() => {
    let active = true
    void app.coping.getSuggestions().then((suggestions) => {
      if (active) setCopingOptions(suggestions)
    })
    return () => {
      active = false
    }
  }, [])

  // Recompute the 80% suggested limits and 90% cap whenever the reference changes.
  useEffect(() => {
    let active = true
    void app.onboarding
      .getSuggestedLimits({ timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk })
      .then((limits) => {
        if (active) setSuggestedLimits(limits)
      })
    return () => {
      active = false
    }
  }, [refTimeMinutes, refStakesCzk])

  const goNext = () => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }
  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
  }

  const resolvedTimeLimit = timeLimitMin ?? suggestedLimits?.timeMinutes ?? 0
  const resolvedStakesLimit = stakesLimitCzk ?? suggestedLimits?.stakesAmount ?? 0
  const copingCount = copingSelected.length + (customStrategy.trim().length > 0 ? 1 : 0)

  // Hand the collected answers to the OnboardingService, then confirm.
  const finishSetup = async () => {
    // Guards against a double-tap firing `complete` twice: the second call would
    // hit the store's append-only `[user_id+week_no]` limit and throw.
    if (submitting) return
    setSubmitting(true)

    // Selected predefined strategies (by id) + the optional custom one → domain coping DTOs.
    const selected = copingSelected
      .map((id) => copingOptions.find((option) => option.id === id))
      .filter((option): option is CopingSuggestionDto => option !== undefined)
      .map((option) => ({ id: option.id, label: option.label, type: 'default' as const }))
    const custom = customStrategy.trim()
    const coping = custom
      ? [...selected, { id: 'custom', label: custom, type: 'custom' as const }]
      : selected

    try {
      const { interventionStartDate: startDate } = await app.onboarding.complete(
        {
          reference: { timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk },
          limits: { timeMinutes: resolvedTimeLimit, stakesAmount: resolvedStakesLimit },
          coping,
        },
        clientNow(),
      )
      setInterventionStartDate(new Date(startDate))
      goNext()
    } catch (error) {
      console.error('[onboarding] complete failed', error)
      setSubmitting(false)
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
          options={copingOptions}
          selected={copingSelected}
          onSelectedChange={setCopingSelected}
          customStrategy={customStrategy}
          onCustomStrategyChange={setCustomStrategy}
          onFinish={() => {
            void finishSetup()
          }}
          onBack={goBack}
          submitting={submitting}
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
