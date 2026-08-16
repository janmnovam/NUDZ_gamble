import { type Page } from '@playwright/test'

/**
 * Test double for the Web Notification API. The reminder feature
 * (`useReminderNotifications`) pops a real `Notification` and wires its
 * `onclick` to route into the app; a headless browser can neither grant the
 * permission prompt nor let us click an OS notification. So we install a fake
 * `Notification` (permission already granted) that records every popup and keeps
 * its click handler reachable, letting a spec assert the popup fired and invoke
 * the click-through — the "simplified trigger" CLAUDE.md allows for reminders.
 */

export interface RecordedNotification {
  title: string
  body: string
}

/** Must be called before the page loads (registers for every navigation). */
export async function installFakeNotifications(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const records: { title: string; body: string; onclick: (() => void) | null }[] = []

    class FakeNotification {
      static permission = 'granted'
      static requestPermission(): Promise<string> {
        return Promise.resolve('granted')
      }
      title: string
      body: string
      onclick: (() => void) | null = null
      constructor(title: string, options?: { body?: string }) {
        this.title = title
        this.body = options?.body ?? ''
        records.push(this)
      }
      close(): void {
        // no-op
      }
    }

    Object.defineProperty(window, 'Notification', {
      value: FakeNotification,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, '__fakeNotifications', {
      value: records,
      configurable: true,
      writable: true,
    })
  })
}

interface NotificationWindow {
  __fakeNotifications: { title: string; body: string; onclick: (() => void) | null }[]
}

/** Every notification the app has popped so far. */
export function recordedNotifications(page: Page): Promise<RecordedNotification[]> {
  return page.evaluate(() =>
    (window as unknown as NotificationWindow).__fakeNotifications.map((n) => ({
      title: n.title,
      body: n.body,
    })),
  )
}

/** Invoke the most recent notification's click-through handler. */
export function clickLastNotification(page: Page): Promise<void> {
  return page.evaluate(() => {
    const list = (window as unknown as NotificationWindow).__fakeNotifications
    const last = list[list.length - 1]
    if (last.onclick) last.onclick()
  })
}
