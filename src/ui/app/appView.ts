import { create } from 'zustand'

/**
 * Top-level screens the app can show. Add new screens here as they land
 * (e.g. 'checkin', 'review') and render them in `App`.
 */
export type AppView = 'loading' | 'onboarding' | 'dashboard' | 'coping' | 'reports'

interface AppViewStore {
  view: AppView
  /** Navigate to a top-level screen. */
  navigate: (view: AppView) => void
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
  navigate: (view) => {
    set({ view })
  },
}))
