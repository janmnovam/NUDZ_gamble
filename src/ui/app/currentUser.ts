import { create } from 'zustand'

import type { UserId } from '@domain/model.ts'

/**
 * The current user's id, held in memory for the session. It is **not** persisted
 * on the client: the backend (the stored profile) is the source of truth. The
 * app resolves it at startup from `OnboardingService.getStatus` and caches it
 * here; onboarding's `complete` adopts the freshly minted id the same way. A
 * reload re-resolves it from the backend.
 */
interface CurrentUserStore {
  /** The current user's id, or `null` before it has been resolved / onboarded. */
  userId: UserId | null
  /** Cache the id resolved from the backend (getStatus) or minted by onboarding. */
  setUserId: (id: UserId) => void
  /** Forget the current user (wipe / reset). */
  clear: () => void
}

export const useCurrentUser = create<CurrentUserStore>()((set) => ({
  userId: null,
  setUserId: (id) => {
    set({ userId: id })
  },
  clear: () => {
    set({ userId: null })
  },
}))
