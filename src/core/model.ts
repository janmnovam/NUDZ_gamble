/**
 * Shared domain model — framework-free entity types.
 *
 * Owned by the data team, consumed by both `src/data` (adapters) and
 * `src/domain` (intervention logic). Contains no Dexie/React imports so the
 * domain layer may import it without breaking its infrastructure boundary.
 *
 * Field names are verbatim from the brief / `src/data/docs/data-model.md`.
 * Money is integer CZK, time is integer minutes, timestamps are ISO 8601.
 */

export type UserId = string
/** ISO 8601 date, `YYYY-MM-DD`. */
export type ISODate = string
/** ISO 8601 timestamp with timezone. */
export type ISOTimestamp = string

/** Origin of a coping strategy row. */
export type CopingType = 'default' | 'custom'

/** Interaction tracked in the engagement log. */
export type UsageEventType = 'exposed' | 'onboarding_completed' | 'app_opened' | 'review_reached'

export interface Profile {
  user_id: UserId
  onboarding_completed_at: ISOTimestamp
  intervention_start_date: ISODate
  reference_time_min: number
  reference_stakes_czk: number
}

export interface CopingStrategy {
  coping_strategy_id: string
  user_id: UserId
  /** Free text — shown to the user as the reminder. */
  label: string
  type: CopingType
  /** Ordering; lower sorts first. */
  priority: number
  active: boolean
  created_at: ISOTimestamp
  updated_at: ISOTimestamp | null
}

/**
 * A predefined suggestion (Dr. Kazmer's list). Seed data, never persisted on
 * its own — adopting one writes a `CopingStrategy` row with `type: 'default'`.
 */
export interface CopingStrategyDefault {
  code: string
  label: string
  priority: number
  reminder_text?: string
}

export interface Limit {
  limit_id: string
  user_id: UserId
  /** 1..4. Append-only: exactly one row per (user, week). */
  week_no: number
  weekly_limit_time_min: number
  weekly_limit_stakes_czk: number
  limit_set_at: ISOTimestamp
}

export interface CheckIn {
  check_in_id: string
  user_id: UserId
  behavior_date: ISODate
  /** 1..4 — links the day to its review week. */
  week_no: number
  played: boolean
  time_min: number
  stakes_czk: number
  winnings_czk: number
  submitted_at: ISOTimestamp
  updated_at: ISOTimestamp | null
}

export interface Review {
  review_id: string
  user_id: UserId
  review_week_no: number
  review_completed_at: ISOTimestamp
  limit_changed: boolean
  incomplete: boolean
}

export interface UsageEvent {
  usage_event_id: string
  user_id: UserId
  event_type: UsageEventType
  occurred_at: ISOTimestamp
  screen: string | null
  detail: string | null
}
