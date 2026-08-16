/**
 * Shared domain model — framework-free entity types.
 *
 * The domain layer speaks **camelCase**; the storage layer
 * (`src/data/model.ts`) keeps the snake_case column names from the brief. The
 * data adapters map between the two at their seam (`src/data/mappers.ts`), so a
 * rename on either side never leaks across the boundary.
 *
 * Money is integer CZK, time is integer minutes, timestamps are ISO 8601.
 */
import type { UsageEventType } from '@domain/usageEventType.ts'

export type UserId = string
/** ISO 8601 date, `YYYY-MM-DD`. */
export type ISODate = string
/** ISO 8601 timestamp with timezone. */
export type ISOTimestamp = string
/** ISO timestamp pinned to UTC midnight for fields that model a calendar day. */
export type ISOCalendarTimestamp = ISOTimestamp

/** Origin of a coping strategy row. */
export type CopingType = 'default' | 'custom'

export interface Profile {
  userId: UserId
  onboardingCompletedAt: ISOTimestamp
  interventionStartDate: ISOCalendarTimestamp
  referenceTimeMin: number
  referenceStakesCzk: number
}

export interface CopingStrategy {
  copingStrategyId: string
  userId: UserId
  /** Free text — shown to the user as the reminder. */
  label: string
  type: CopingType
  /** Optional detail, editable only for `type: 'custom'` — "Kdy ji chci použít?" */
  whenToUse: string | null
  /** Optional detail, editable only for `type: 'custom'` — "Jak začnu?" */
  howToStart: string | null
  /** Ordering; lower sorts first. */
  priority: number
  active: boolean
  createdAt: ISOTimestamp
  updatedAt: ISOTimestamp | null
}

/**
 * Fields a caller supplies when creating a coping strategy. The adapter
 * generates `copingStrategyId`, defaults `active` to `true`, defaults
 * `whenToUse`/`howToStart` to `null`, and stamps `createdAt` / `updatedAt`.
 */
export type CopingStrategyInput = Pick<CopingStrategy, 'userId' | 'label' | 'type' | 'priority'> & {
  active?: boolean
  whenToUse?: string | null
  howToStart?: string | null
}

/**
 * Fields a caller may change on an existing **custom** strategy — catalog
 * (`type: 'default'`) strategies are read-only. Omitted keys are left
 * untouched; the repo rejects an unknown id or a non-custom strategy.
 */
export type CopingStrategyUpdate = Partial<
  Pick<CopingStrategy, 'label' | 'whenToUse' | 'howToStart'>
>

/**
 * A predefined suggestion (Dr. Kazmer's list). Seed data, never persisted on
 * its own — adopting one writes a `CopingStrategy` row with `type: 'default'`.
 */
export interface CopingStrategyDefault {
  code: string
  label: string
  priority: number
  reminderText?: string
}

export interface Limit {
  limitId: string
  userId: UserId
  /** 1..4. Append-only: exactly one row per (user, week). */
  weekNo: number
  weeklyLimitTimeMin: number
  weeklyLimitStakesCzk: number
  limitSetAt: ISOTimestamp
}

export interface CheckIn {
  checkInId: string
  userId: UserId
  behaviorDate: ISOCalendarTimestamp
  /** 1..4 — links the day to its review week. */
  weekNo: number
  played: boolean
  timeMin: number
  stakesCzk: number
  winningsCzk: number
  submittedAt: ISOTimestamp
  updatedAt: ISOTimestamp | null
}

export interface Review {
  reviewId: string
  userId: UserId
  reviewWeekNo: number
  reviewCompletedAt: ISOTimestamp
  limitChanged: boolean
  incomplete: boolean
}

export interface UsageEvent {
  usageEventId: string
  userId: UserId
  eventType: UsageEventType
  occurredAt: ISOTimestamp
  screen: string | null
  detail: string | null
}

export type ContactCategory = 'counselling' | 'emergency'

export interface Contact {
  contactId: string
  name: string
  purpose: string | null
  phone: string | null
  url: string | null
  availability: string | null
  category: ContactCategory
  priority: number
}

/** Whether an edit-log row records the first save of a check-in or a later change. */
export type CheckInEditAction = 'created' | 'updated'

export interface CheckInEdit {
  checkInEditId: string
  userId: UserId
  checkInId: string
  action: CheckInEditAction
  editedAt: ISOTimestamp
  changedFields: string[]
  /** JSON snapshot before the change; `null` for a `created` row. */
  before: string | null
  /** JSON snapshot after the change. */
  after: string | null
}
