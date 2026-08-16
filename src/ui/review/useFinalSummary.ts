import { useEffect, useState } from 'react'

import { useReviewService } from '@ui/app/AppContext.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { toFinalSummaryViewModel } from '@ui/review/toFinalSummaryViewModel.ts'
import { toProgrammeSummary, type ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'
import { weekdayAbbrev } from '@ui/lib/date.ts'
import type { FinalSummaryViewModel } from '@ui/review/types.ts'

export type FinalSummaryState =
  | { status: 'loading' }
  | { status: 'ready'; summary: FinalSummaryViewModel; programme: ProgrammeSummary }
  | { status: 'failed'; message: TranslationKey }

/** Loads the four-week summary from `ReviewService` and labels it for the screens. */
export function useFinalSummary(): FinalSummaryState {
  const review = useReviewService()
  const userId = useCurrentUser((s) => s.userId)
  const { t, locale } = useTranslation()
  const [state, setState] = useState<FinalSummaryState>({ status: 'loading' })

  useEffect(() => {
    if (userId === null) return
    let cancelled = false
    const now = clientNow()

    void review.getFinalSummary(userId, now).then((res) => {
      if (cancelled) return
      if (res.error || !res.data) {
        console.error('[reports] getFinalSummary failed', res.error)
        setState({ status: 'failed', message: errorMessageKey(res.error) })
        return
      }
      setState({
        status: 'ready',
        programme: toProgrammeSummary(res.data, (isoDate) => weekdayAbbrev(isoDate, locale), now),
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
  }, [review, userId, t, locale])

  return state
}
