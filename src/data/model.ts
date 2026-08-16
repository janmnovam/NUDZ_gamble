/**
 * Shared domain model — framework-free entity types.
 *
 * Owned by the data team, consumed by both `src/data` (adapters) and
 * `src/domain` (intervention logic). Contains no Dexie/React imports so the
 * domain layer may import it without breaking its infrastructure boundary.
 *
 * Field names are verbatim from the brief / `docs/data-model.md`.
 * Money is integer CZK, time is integer minutes, timestamps are ISO 8601.
 */
import type {
  CheckInEditAction,
  ContactCategory,
  CopingType,
  ISOCalendarTimestamp,
  ISOTimestamp,
  UserId,
} from '@domain/model.ts'
import type { UsageEventType } from '@domain/usageEventType.ts'

export interface ProfileEntity {
  user_id: UserId
  onboarding_completed_at: ISOTimestamp
  intervention_start_date: ISOCalendarTimestamp
  reference_time_min: number
  reference_stakes_czk: number
}

export interface CopingStrategyEntity {
  coping_strategy_id: string
  user_id: UserId
  /** Free text — shown to the user as the reminder. */
  label: string
  type: CopingType
  /** Optional detail, editable only for `type: 'custom'` — "Kdy ji chci použít?" */
  when_to_use: string | null
  /** Optional detail, editable only for `type: 'custom'` — "Jak začnu?" */
  how_to_start: string | null
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
export interface CopingStrategyDefaultEntity {
  code: string
  label: string
  priority: number
  reminder_text?: string
}

export interface LimitEntity {
  limit_id: string
  user_id: UserId
  /** 1..4. Append-only: exactly one row per (user, week). */
  week_no: number
  weekly_limit_time_min: number
  weekly_limit_stakes_czk: number
  limit_set_at: ISOTimestamp
}

export interface CheckInEntity {
  check_in_id: string
  user_id: UserId
  behavior_date: ISOCalendarTimestamp
  /** 1..4 — links the day to its review week. */
  week_no: number
  played: boolean
  time_min: number
  stakes_czk: number
  winnings_czk: number
  submitted_at: ISOTimestamp
  updated_at: ISOTimestamp | null
}

export interface ReviewEntity {
  review_id: string
  user_id: UserId
  review_week_no: number
  review_completed_at: ISOTimestamp
  limit_changed: boolean
  incomplete: boolean
}

export interface UsageEventEntity {
  usage_event_id: string
  user_id: UserId
  event_type: UsageEventType
  occurred_at: ISOTimestamp
  screen: string | null
  detail: string | null
}

export interface ContactEntity {
  contact_id: string
  name: string
  purpose: string | null
  phone: string | null
  url: string | null
  availability: string | null
  category: ContactCategory
  priority: number
}

export interface CheckInEditEntity {
  check_in_edit_id: string
  user_id: UserId
  check_in_id: string
  action: CheckInEditAction
  backfill: boolean
  edited_at: ISOTimestamp
  changed_fields: string[]
  before: string | null
  after: string | null
}
