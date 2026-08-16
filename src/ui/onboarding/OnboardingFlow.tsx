import { useEffect, useRef, useState } from 'react'

import { useCopingService, useOnboardingService } from '@ui/app/AppContext.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { DoneStep } from '@ui/onboarding/steps/DoneStep.tsx'
import { IntroStep } from '@ui/onboarding/steps/IntroStep.tsx'
import { LimitsStep } from '@ui/onboarding/steps/LimitsStep.tsx'
import { RefStakesStep } from '@ui/onboarding/steps/RefStakesStep.tsx'
import { RefTimeStep } from '@ui/onboarding/steps/RefTimeStep.tsx'
import { type CopingDto, type SuggestedLimitsResponse } from '@/app/dto/onboarding.ts'
import { type CopingSuggestionDto } from '@/app/dto/coping.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'
import * as notificationGateway from '@ui/notifications/notificationGateway.ts'

const TOTAL_STEPS = 6

interface OnboardingFlowProps {
  /** Called when the user acknowledges the final screen (seam to the dashboard). */
  onComplete: () => void
}

function normalizeCustomCoping(customCoping: CopingDto | null): CopingDto | null {
  if (customCoping === null) return null

  const label = customCoping.label.trim()
  return label.length === 0 ? null : { ...customCoping, label }
}

/**
 * Light flow shell: owns which onboarding step is shown and the answers collected
 * so far (UI state only), and hands each step its navigation callbacks.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const onboarding = useOnboardingService()
  const coping = useCopingService()
  const rememberInterventionStart = useAdminStore((s) => s.setInterventionStartDate)
  const adoptCurrentUser = useCurrentUser((s) => s.setUserId)
  const submittingRef = useRef(false)

  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [refTimeMinutes, setRefTimeMinutes] = useState(0)
  const [refStakesCzk, setRefStakesCzk] = useState(0)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [stakesLimitCzk, setStakesLimitCzk] = useState<number | null>(null)
  const [suggestedLimits, setSuggestedLimits] = useState<SuggestedLimitsResponse | null>(null)
  const [copingStrategies, setCopingStrategies] = useState<CopingSuggestionDto[]>([])
  const [copingSelected, setCopingSelected] = useState<CopingSuggestionDto[]>([])
  const [customCoping, setCustomCoping] = useState<CopingDto | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [interventionStartDate, setInterventionStartDate] = useState<Date | null>(null)

  // Load the predefined coping suggestions once; map each to the domain-shaped
  useEffect(() => {
    let active = true
    void coping.getSuggestions(clientNow()).then((res) => {
      if (active && res.data) setCopingStrategies(res.data)
    })
    return () => {
      active = false
    }
  }, [coping])

  // Derive the suggested limits and absolute cap from the reference whenever it changes.
  useEffect(() => {
    let active = true
    void onboarding
      .getSuggestedLimits({ timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk }, clientNow())
      .then((res) => {
        if (active) setSuggestedLimits(res.data)
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

  const resolvedTimeLimit = timeLimitMinutes ?? suggestedLimits?.timeMinutes ?? 0
  const resolvedStakesLimit = stakesLimitCzk ?? suggestedLimits?.stakesAmount ?? 0
  const normalizedCustomCoping = normalizeCustomCoping(customCoping)
  const copingCount = copingSelected.length + (normalizedCustomCoping ? 1 : 0)

  // Persist via the onboarding service, then confirm.
  const finishSetup = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const res = await onboarding.complete(
        {
          reference: { timeMinutes: refTimeMinutes, stakesAmount: refStakesCzk },
          limits: { timeMinutes: resolvedTimeLimit, stakesAmount: resolvedStakesLimit },
          coping: [...copingSelected, ...(normalizedCustomCoping ? [normalizedCustomCoping] : [])],
        },
        clientNow(),
      )
      if (res.error || !res.data) {
        submittingRef.current = false
        console.error('[onboarding] completion failed', res.error)
        setSubmitError(t(errorMessageKey(res.error)))
        return
      }
      // The service just minted the user id; adopt it so every later screen
      // (and a reload) talks to the backend as the profile we just created.
      adoptCurrentUser(res.data.userId)
      setSubmitError(null)
      setInterventionStartDate(new Date(res.data.interventionStartDate))
      rememberInterventionStart(res.data.interventionStartDate)
      if (
        notificationGateway.isNotificationSupported() &&
        notificationGateway.getPermission() === 'default'
      ) {
        await notificationGateway.requestPermission()
      }
      goNext()
    } catch (error) {
      submittingRef.current = false
      console.error('[onboarding] completion failed', error)
      setSubmitError(t(errorMessageKey(null)))
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
        <LimitsStep
          referenceTimeMinutes={refTimeMinutes}
          referenceStakes={refStakesCzk}
          suggestedTimeMinutes={suggestedLimits?.timeMinutes ?? 0}
          suggestedStakesCzk={suggestedLimits?.stakesAmount ?? 0}
          timeCapMinutes={suggestedLimits?.timeCapMinutes ?? 0}
          stakesCapCzk={suggestedLimits?.stakesCapAmount ?? 0}
          timeLimit={timeLimitMinutes}
          stakesLimit={stakesLimitCzk}
          onTimeLimitChange={setTimeLimitMinutes}
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
          {...(submitError === null ? {} : { error: submitError })}
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
          onDone={onComplete}
        />
      )
  }
}
