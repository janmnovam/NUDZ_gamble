import { useEffect, useState } from 'react'

import { type ReviewResponse } from '@/app/dto/review.ts'
import { useAdminStore } from '@ui/admin/adminStore.ts'
import { useAppView } from '@ui/app/appView.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { useReviewService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'
import { Screen } from '@ui/components/Screen.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { WeekReviewScreen } from '@ui/review/WeekReviewScreen.tsx'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; review: ReviewResponse }
  | { status: 'failed'; message: TranslationKey }

/**
 * Start-of-week gate: when a closed week's review is pending, the next week has
 * no limits yet, so we prompt for them (previous limits pre-filled) before the
 * dashboard — which otherwise cannot render a week with no limit. On save the
 * limits are written and we return to the dashboard; if another earlier week is
 * still unreviewed, the dashboard gate routes back here for it.
 */
export function WeekReviewFlow() {
  const { t } = useTranslation()
  const reviewService = useReviewService()
  const userId = useCurrentUser((s) => s.userId)
  const simulatedTime = useAdminStore((s) => s.simulatedTime)
  const navigate = useAppView((s) => s.navigate)

  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [stakesAmount, setStakesAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<TranslationKey | null>(null)

  useEffect(() => {
    if (userId === null) return
    let cancelled = false
    const time = simulatedTime ?? clientNow()

    void reviewService.getPendingReview(userId, time).then((res) => {
      if (cancelled) return
      if (res.error) {
        console.error('[review] getPendingReview failed', res.error)
        setState({ status: 'failed', message: errorMessageKey(res.error) })
        return
      }
      if (!res.data) {
        // Nothing pending — the current week already has limits.
        navigate('dashboard')
        return
      }
      setTimeMinutes(res.data.suggestedNextLimits.timeMinutes)
      setStakesAmount(res.data.suggestedNextLimits.stakesAmount)
      setState({ status: 'ready', review: res.data })
    })

    return () => {
      cancelled = true
    }
  }, [reviewService, userId, simulatedTime, navigate])

  const submit = () => {
    if (state.status !== 'ready' || userId === null || submitting) return
    setSubmitting(true)
    setErrorMessage(null)
    const time = simulatedTime ?? clientNow()

    void reviewService
      .completeReview(
        {
          reviewWeekNo: state.review.weekNo,
          nextLimits: { timeMinutes, stakesAmount },
          incomplete: state.review.missingDays.length > 0,
        },
        userId,
        time,
      )
      .then((res) => {
        if (res.error) {
          console.error('[review] completeReview failed', res.error)
          setErrorMessage(errorMessageKey(res.error))
          setSubmitting(false)
          return
        }
        navigate('dashboard')
      })
  }

  if (state.status !== 'ready') {
    return (
      <Screen nav={<TabBar active="home" />}>
        <p className="type-body text-muted m-auto text-center">
          {state.status === 'loading' ? t('common.loading') : t(state.message)}
        </p>
      </Screen>
    )
  }

  return (
    <WeekReviewScreen
      review={state.review}
      timeMinutes={timeMinutes}
      stakesCzk={stakesAmount}
      onTimeChange={setTimeMinutes}
      onStakesChange={setStakesAmount}
      onConfirm={submit}
      submitting={submitting}
      errorMessage={errorMessage ? t(errorMessage) : null}
    />
  )
}
