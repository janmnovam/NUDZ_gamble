/**
 * App-layer constants. This is a single-demo-user app (CLAUDE.md): the
 * onboarding DTO carries no user id, so the service supplies this fixed one
 * when building domain records.
 */
import type { UserId } from '@domain/model.ts'

export const DEMO_USER_ID: UserId = 'demo-user'
