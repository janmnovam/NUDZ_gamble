import { create } from 'zustand'

/**
 * Top-level screens the app can show. Add new screens here as they land
 * (e.g. 'checkin', 'review') and render them in `App`.
 */
export type AppView =
  'loading' | 'onboarding' | 'dashboard' | 'review' | 'checkin' | 'coping' | 'reports'

/** Optional targets a navigation can carry to the destination screen. */
interface NavigateParams {
  /**
   * Calendar date (`ISOCalendarTimestamp`) a backfill check-in should target,
   * set when the user taps a specific missing day on the dashboard. Cleared on
   * any navigation that doesn't pass it, so it never leaks into a later visit.
   */
  behaviorDate?: string
}

interface AppViewStore {
  view: AppView
  /** Target day for a backfill check-in, or `null` for the default (latest missing) pick. */
  checkinBehaviorDate: string | null
  /** Navigate to a top-level screen, optionally carrying a target day for check-in. */
  navigate: (view: AppView, params?: NavigateParams) => void
}

/**
 * Global app-view (navigation) store. A Zustand module singleton — no provider
 * needed, so any component at any depth can read `view` or call `navigate`
 * without prop-drilling. This is the home for app-level navigation as the app
 * grows (more screens, later a back stack / deep links).
 *
 * Starts on 'loading' until `onboarding.getStatus()` resolves and `App` routes
 * to 'onboarding' or 'dashboard'.
 */
export const useAppView = create<AppViewStore>()((set) => ({
  view: 'loading',
  checkinBehaviorDate: null,
  navigate: (view, params) => {
    set({ view, checkinBehaviorDate: params?.behaviorDate ?? null })
  },
}))
