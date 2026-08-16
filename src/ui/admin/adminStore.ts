import { create } from 'zustand'

import type { ISOTimestamp } from '@domain/model.ts'
import { db } from '@/core/index.ts'
import { isoForDay } from '@ui/clock.ts'

/**
 * Hidden demo/admin console state (the "Stroj času" overlay). Kept in a module
 * singleton like `useAppView` so the trigger, the overlay, and the dashboard
 * header pill share it without prop-drilling.
 *
 * Time is no longer a global clock the backend reads — each view passes the
 * instant explicitly. This store just holds the *simulated* instant (or `null`
 * for the real clock); a consumer like `DashboardFlow` passes `simulatedTime ??
 * clientNow()` into its service call. To turn the user-entered intervention day
 * into an instant we need `interventionStartDate` (day 1); it comes back from
 * onboarding's `complete()` and is persisted so it survives a reload — the demo
 * data in IndexedDB does too.
 */
const START_KEY = 'nudz.interventionStartDate'

function loadStart(): ISOTimestamp | null {
  try {
    return localStorage.getItem(START_KEY)
  } catch {
    return null
  }
}

interface AdminStore {
  /** Whether the time-machine overlay is visible. */
  panelOpen: boolean
  /** The simulated instant every dashboard read uses, or `null` for real time. */
  simulatedTime: ISOTimestamp | null
  /** Day 1 of the intervention, needed to map a day number to an instant. */
  interventionStartDate: ISOTimestamp | null
  openPanel: () => void
  closePanel: () => void
  /** Remember day 1 (from onboarding's `complete()` response). */
  setInterventionStartDate: (iso: ISOTimestamp) => void
  /** Simulate study `day` by pinning the clock to that day's instant. */
  simulateDay: (day: number) => void
  /** Return to the real clock. */
  exitTimeMachine: () => void
  /** Wipe all local data (IndexedDB + remembered start) and reload to onboarding. */
  wipeData: () => Promise<void>
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  panelOpen: false,
  simulatedTime: null,
  interventionStartDate: loadStart(),
  openPanel: () => {
    set({ panelOpen: true })
  },
  closePanel: () => {
    set({ panelOpen: false })
  },
  setInterventionStartDate: (iso) => {
    try {
      localStorage.setItem(START_KEY, iso)
    } catch {
      // Non-fatal: the time machine just won't survive a reload.
    }
    set({ interventionStartDate: iso })
  },
  simulateDay: (day) => {
    const start = get().interventionStartDate
    if (start === null) return // no known day 1 — nothing to anchor to
    set({ simulatedTime: isoForDay(start, day), panelOpen: false })
  },
  exitTimeMachine: () => {
    set({ simulatedTime: null, panelOpen: false })
  },
  wipeData: async () => {
    try {
      localStorage.removeItem(START_KEY)
    } catch {
      // ignore
    }
    await db.delete()
    window.location.reload()
  },
}))
