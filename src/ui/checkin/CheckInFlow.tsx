import { useMemo, useState } from 'react'

import type { DashboardVM } from '@domain/dashboard.ts'
import { dayStateOf, type CheckInDraft, type DayState } from '@domain/checkin.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'
import { DetailsStep } from '@ui/checkin/steps/DetailsStep.tsx'
import { PlayedStep } from '@ui/checkin/steps/PlayedStep.tsx'

type CheckInStep = 'played' | 'details'

export interface CheckInFlowResult {
  userId: UserId
  weekNo: number
  submittedAt: ISOTimestamp
  draft: CheckInDraft
  previousDayState: DayState
}

interface CheckInFlowProps {
  userId: UserId
  behaviorDate: ISOCalendarTimestamp
  weekNo: number
  today: ISODate
  now: ISOTimestamp
  existingCheckIn?: CheckIn | undefined
  /** Reserved for the dashboard handoff; the two-page check-in itself does not render charts. */
  dashboard?: DashboardVM | undefined
  programDayLabel?: string | undefined
  weekLabel?: string | undefined
  behaviorDateLabel?: string | undefined
  onComplete: (result: CheckInFlowResult) => void
  onCancel?: () => void
}

function zeroDraft(behaviorDate: ISOCalendarTimestamp): CheckInDraft {
  return {
    behaviorDate,
    played: false,
    timeMin: 0,
    stakesCzk: 0,
    winningsCzk: 0,
  }
}

export function CheckInFlow({
  userId,
  behaviorDate,
  weekNo,
  today,
  now,
  existingCheckIn,
  programDayLabel,
  weekLabel,
  behaviorDateLabel,
  onComplete,
  onCancel,
}: CheckInFlowProps) {
  const [step, setStep] = useState<CheckInStep>('played')
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [stakesCzk, setStakesCzk] = useState(0)

  const previousDayState = useMemo(
    () => dayStateOf({ behaviorDate, today, checkIn: existingCheckIn }),
    [behaviorDate, existingCheckIn, today],
  )

  const completeDraft = (draft: CheckInDraft) => {
    onComplete({
      userId,
      weekNo,
      submittedAt: now,
      draft,
      previousDayState,
    })
  }

  const goBack = () => {
    if (step === 'played') {
      onCancel?.()
    } else {
      setStep('played')
    }
  }

  const commonLabels = {
    programDayLabel,
    weekLabel,
    behaviorDateLabel,
  }

  if (step === 'played') {
    return (
      <PlayedStep
        {...commonLabels}
        previousDayState={previousDayState}
        onBack={goBack}
        onPlayed={() => {
          setStep('details')
        }}
        onNotPlayed={() => {
          completeDraft(zeroDraft(behaviorDate))
        }}
      />
    )
  }

  return (
    <DetailsStep
      {...commonLabels}
      minutes={timeMinutes}
      stakes={stakesCzk}
      onMinutesChange={setTimeMinutes}
      onStakesChange={setStakesCzk}
      onBack={goBack}
      onComplete={() => {
        completeDraft({
          behaviorDate,
          played: true,
          timeMin: timeMinutes,
          stakesCzk,
          winningsCzk: 0,
        })
      }}
    />
  )
}
