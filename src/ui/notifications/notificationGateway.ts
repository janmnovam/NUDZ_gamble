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

/** No-op unless permission is already granted — callers request it first. */
export function showNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  new Notification(title, { body })
}

export function getLastFiredAt(): ISOTimestamp | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LAST_FIRED_KEY)
}

export function setLastFiredAt(time: ISOTimestamp): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LAST_FIRED_KEY, time)
}
