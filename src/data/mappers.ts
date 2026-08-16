/**
 * Domain ⟷ storage-entity mappers — the seam between the camelCase domain
 * model (`@domain/model.ts`) and the snake_case rows Dexie persists
 * (`@data/model.ts`). One pair per entity an adapter touches; each is a pure
 * field-for-field rename, so a change on either side stays local to this file.
 */
import type {
  CheckInEditEntity,
  CheckInEntity,
  ContactEntity,
  CopingStrategyDefaultEntity,
  CopingStrategyEntity,
  LimitEntity,
  ProfileEntity,
  ReviewEntity,
  UsageEventEntity,
} from '@data/model.ts'
import { canonicalCalendarTimestamp } from '@domain/clock.ts'
import type {
  CheckIn,
  CheckInEdit,
  Contact,
  CopingStrategy,
  CopingStrategyDefault,
  Limit,
  Profile,
  Review,
  UsageEvent,
} from '@domain/model.ts'

export const profileToEntity = (p: Profile): ProfileEntity => ({
  user_id: p.userId,
  onboarding_completed_at: p.onboardingCompletedAt,
  intervention_start_date: canonicalCalendarTimestamp(p.interventionStartDate),
  reference_time_min: p.referenceTimeMin,
  reference_stakes_czk: p.referenceStakesCzk,
})

export const profileToDomain = (e: ProfileEntity): Profile => ({
  userId: e.user_id,
  onboardingCompletedAt: e.onboarding_completed_at,
  interventionStartDate: canonicalCalendarTimestamp(e.intervention_start_date),
  referenceTimeMin: e.reference_time_min,
  referenceStakesCzk: e.reference_stakes_czk,
})

export const copingToEntity = (c: CopingStrategy): CopingStrategyEntity => ({
  coping_strategy_id: c.copingStrategyId,
  user_id: c.userId,
  label: c.label,
  type: c.type,
  when_to_use: c.whenToUse,
  how_to_start: c.howToStart,
  priority: c.priority,
  active: c.active,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
})

export const copingToDomain = (e: CopingStrategyEntity): CopingStrategy => ({
  copingStrategyId: e.coping_strategy_id,
  userId: e.user_id,
  label: e.label,
  type: e.type,
  whenToUse: e.when_to_use,
  howToStart: e.how_to_start,
  priority: e.priority,
  active: e.active,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
})

export const copingDefaultToDomain = (e: CopingStrategyDefaultEntity): CopingStrategyDefault => ({
  code: e.code,
  label: e.label,
  priority: e.priority,
  // `exactOptionalPropertyTypes`: omit the key entirely rather than set it undefined.
  ...(e.reminder_text !== undefined ? { reminderText: e.reminder_text } : {}),
})

export const limitToEntity = (l: Limit): LimitEntity => ({
  limit_id: l.limitId,
  user_id: l.userId,
  week_no: l.weekNo,
  weekly_limit_time_min: l.weeklyLimitTimeMin,
  weekly_limit_stakes_czk: l.weeklyLimitStakesCzk,
  limit_set_at: l.limitSetAt,
})

export const limitToDomain = (e: LimitEntity): Limit => ({
  limitId: e.limit_id,
  userId: e.user_id,
  weekNo: e.week_no,
  weeklyLimitTimeMin: e.weekly_limit_time_min,
  weeklyLimitStakesCzk: e.weekly_limit_stakes_czk,
  limitSetAt: e.limit_set_at,
})

export const checkInToEntity = (c: CheckIn): CheckInEntity => ({
  check_in_id: c.checkInId,
  user_id: c.userId,
  behavior_date: canonicalCalendarTimestamp(c.behaviorDate),
  week_no: c.weekNo,
  played: c.played,
  time_min: c.timeMin,
  stakes_czk: c.stakesCzk,
  winnings_czk: c.winningsCzk,
  submitted_at: c.submittedAt,
  updated_at: c.updatedAt,
})

export const checkInToDomain = (e: CheckInEntity): CheckIn => ({
  checkInId: e.check_in_id,
  userId: e.user_id,
  behaviorDate: canonicalCalendarTimestamp(e.behavior_date),
  weekNo: e.week_no,
  played: e.played,
  timeMin: e.time_min,
  stakesCzk: e.stakes_czk,
  winningsCzk: e.winnings_czk,
  submittedAt: e.submitted_at,
  updatedAt: e.updated_at,
})

export const checkInEditToEntity = (c: CheckInEdit): CheckInEditEntity => ({
  check_in_edit_id: c.checkInEditId,
  user_id: c.userId,
  check_in_id: c.checkInId,
  action: c.action,
  backfill: c.backfill,
  edited_at: c.editedAt,
  changed_fields: c.changedFields,
  before: c.before,
  after: c.after,
})

export const checkInEditToDomain = (e: CheckInEditEntity): CheckInEdit => ({
  checkInEditId: e.check_in_edit_id,
  userId: e.user_id,
  checkInId: e.check_in_id,
  action: e.action,
  backfill: e.backfill,
  editedAt: e.edited_at,
  changedFields: e.changed_fields,
  before: e.before,
  after: e.after,
})

export const contactToDomain = (e: ContactEntity): Contact => ({
  contactId: e.contact_id,
  name: e.name,
  purpose: e.purpose,
  phone: e.phone,
  url: e.url,
  availability: e.availability,
  category: e.category,
  priority: e.priority,
})

export const reviewToEntity = (r: Review): ReviewEntity => ({
  review_id: r.reviewId,
  user_id: r.userId,
  review_week_no: r.reviewWeekNo,
  review_completed_at: r.reviewCompletedAt,
  limit_changed: r.limitChanged,
  incomplete: r.incomplete,
})

export const reviewToDomain = (e: ReviewEntity): Review => ({
  reviewId: e.review_id,
  userId: e.user_id,
  reviewWeekNo: e.review_week_no,
  reviewCompletedAt: e.review_completed_at,
  limitChanged: e.limit_changed,
  incomplete: e.incomplete,
})

export const usageEventToEntity = (u: UsageEvent): UsageEventEntity => ({
  usage_event_id: u.usageEventId,
  user_id: u.userId,
  event_type: u.eventType,
  occurred_at: u.occurredAt,
  screen: u.screen,
  detail: u.detail,
})

export const usageEventToDomain = (e: UsageEventEntity): UsageEvent => ({
  usageEventId: e.usage_event_id,
  userId: e.user_id,
  eventType: e.event_type,
  occurredAt: e.occurred_at,
  screen: e.screen,
  detail: e.detail,
})
