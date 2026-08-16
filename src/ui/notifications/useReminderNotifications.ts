import { useEffect } from 'react'

import { useAdminStore } from '@ui/admin/adminStore.ts'
import { useNotificationService } from '@ui/app/AppContext.ts'
import { useAppView } from '@ui/app/appView.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { clientNow } from '@ui/clock.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import * as gateway from '@ui/notifications/notificationGateway.ts'

const POLL_INTERVAL_MS = 60_000

/**
 * Polls `NotificationService` every minute while the app is open and pops a
 * system notification once a configured reminder slot (`config.ts`'s
 * `REMINDER_TIMES`) is crossed and there's something to prompt about — a
 * missing check-in (`checkin_due`) or an open weekly review (`review_due`).
 * Clicking the popup focuses the app and routes to the matching screen.
 *
 * Simplified trigger, per CLAUDE.md's allowance for the one reminder
 * scenario: this is a local-only, single-demo-user app with no push server,
 * so nothing wakes the app while it's fully closed — the popup only fires
 * for as long as the installed app (or a tab) is open. Documented in README.
 *
 * Uses the time machine's simulated instant when engaged (falling back to the
 * real clock) so a tester can dial the clock up to a `REMINDER_TIMES` slot
 * (`admin/TimeMachineModal.tsx`'s time-of-day input) to see a popup fire
 * without waiting for the real wall clock.
 */
export function useReminderNotifications(): void {
  const notification = useNotificationService()
  const userId = useCurrentUser((s) => s.userId)
  const simulatedTime = useAdminStore((s) => s.simulatedTime)
  const navigate = useAppView((s) => s.navigate)
  const { t, locale } = useTranslation()

  useEffect(() => {
    if (userId === null) return
    let cancelled = false
    // A function, not a bare flag read: defeats TS's narrowing across the
    // `await` below, which would otherwise (wrongly) treat `cancelled` as
    // statically `false` after the first guard, since the mutation happens
    // in the cleanup closure below rather than in `check` itself.
    const isCancelled = () => cancelled

    async function check() {
      if (userId === null || !gateway.isNotificationSupported()) return

      const time = simulatedTime ?? clientNow()
      const result = await notification.checkSchedule({
        userId,
        time,
        lastFiredAt: gateway.getLastFiredAt(),
      })
      if (isCancelled() || !result.due || result.reminder === null) return

      if (gateway.getPermission() === 'default') {
        await gateway.requestPermission()
      }
      if (isCancelled() || gateway.getPermission() !== 'granted') return

      const reminder = result.reminder
      if (reminder.kind === 'checkin_due') {
        const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric' }).format(
          new Date(reminder.behaviorDate),
        )
        gateway.showNotification(
          t('notification.reminder.title'),
          t('notification.reminder.body', { date }),
          () => {
            navigate('checkin')
          },
        )
      } else {
        gateway.showNotification(
          t('notification.reminder.review.title'),
          t('notification.reminder.review.body', { week: reminder.weekNo }),
          () => {
            navigate('review')
          },
        )
      }
      gateway.setLastFiredAt(time)
    }

    void check()
    const interval = window.setInterval(() => void check(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [notification, userId, simulatedTime, navigate, t, locale])
}
