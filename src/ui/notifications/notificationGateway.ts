/**
 * Thin wrapper around the browser `Notification` API + the one bit of local
 * state it needs (when a reminder last actually fired) — kept out of the
 * hook so the polling logic in `useReminderNotifications.ts` stays testable
 * without a DOM `Notification` global.
 */
import type { ISOTimestamp } from '@domain/model.ts'

const LAST_FIRED_KEY = 'nudz.reminder.lastFiredAt'

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** `'unsupported'` on a browser with no `Notification` API at all (never asked). */
export function getPermission(): NotificationPermission | 'unsupported' {
  return isNotificationSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  return Notification.requestPermission()
}

/**
 * No-op unless permission is already granted — callers request it first.
 * `onClick`, if given, wires the notification's click-through: focuses the
 * app tab and runs the callback (e.g. routing to the check-in or review
 * screen), mirroring how clicking a real OS notification would surface it.
 */
export function showNotification(title: string, body: string, onClick?: () => void): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  const notification = new Notification(title, { body })
  if (onClick) {
    notification.onclick = () => {
      window.focus()
      notification.close()
      onClick()
    }
  }
}

export function getLastFiredAt(): ISOTimestamp | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LAST_FIRED_KEY)
}

export function setLastFiredAt(time: ISOTimestamp): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LAST_FIRED_KEY, time)
}

/**
 * Forgets the last-fired bookkeeping so the next configured slot re-arms
 * immediately. Used by the time machine when a tester jumps the simulated
 * clock, so a demo run isn't blocked by "already fired today" from a
 * previous, unrelated instant.
 */
export function clearLastFiredAt(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LAST_FIRED_KEY)
}
