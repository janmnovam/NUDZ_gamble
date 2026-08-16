import { useEffect, useState } from 'react'

import { DEMO_USER_ID } from '@/app/constants.ts'
import { useReviewService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { toFinalSummaryViewModel } from '@ui/review/toFinalSummaryViewModel.ts'
import type { FinalSummaryViewModel } from '@ui/review/types.ts'

export type FinalSummaryState =
  { status: 'loading' } | { status: 'ready'; summary: FinalSummaryViewModel } | { status: 'failed' }

/** Loads the four-week summary from `ReviewService` and labels it for the screens. */
export function useFinalSummary(): FinalSummaryState {
  const review = useReviewService()
  const { t, locale } = useTranslation()
  const [state, setState] = useState<FinalSummaryState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    void review.getFinalSummary(DEMO_USER_ID, clientNow()).then((res) => {
      if (cancelled) return
      if (res.error || !res.data) {
        console.error('[reports] getFinalSummary failed', res.error)
        setState({ status: 'failed' })
        return
      }
      setState({
        status: 'ready',
        summary: toFinalSummaryViewModel(res.data, locale, {
          hourUnit: t('dashboard.unitHour'),
          minuteUnit: t('dashboard.unitMinute'),
          currency: t('dashboard.currency'),
          programmeDay: (studyDay) => t('review.final.day', { day: studyDay }),
        }),
      })
    })

    return () => {
      cancelled = true
    }
  }, [review, t, locale])

  return state
}
