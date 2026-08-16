/**
 * Maps an `ExportBundle` (`@domain/export.ts`) onto four CSV texts — one
 * per table, stable snake_case column names per README's "Exporting data
 * from app". Bundling them into a single downloadable ZIP is
 * `src/app/lib/zip.ts`; turning that byte array into a browser download
 * (Blob + object URL) is a UI concern, out of scope here.
 */
import { calendarDate } from '@domain/clock.ts'
import type { CheckIn, CopingStrategy, Limit, Profile } from '@domain/model.ts'

/** RFC 4180 field quoting — only when the value actually needs it. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(columns: readonly string[], rows: readonly string[][]): string {
  const lines = [columns.join(','), ...rows.map((row) => row.map(csvField).join(','))]
  return lines.join('\r\n') + '\r\n'
}

const PROFILE_COLUMNS = [
  'user_id',
  'onboarding_completed_at',
  'intervention_start_date',
  'reference_time_min',
  'reference_stakes_czk',
] as const

/**
 * One row, or headers only before onboarding has been completed.
 * `intervention_start_date` is truncated for the same reason `behavior_date`
 * is: it models a calendar day, and is stored as a canonical UTC-midnight
 * timestamp.
 */
export function toProfileCsv(profile: Profile | undefined): string {
  return toCsv(
    PROFILE_COLUMNS,
    profile === undefined
      ? []
      : [
          [
            profile.userId,
            profile.onboardingCompletedAt,
            calendarDate(profile.interventionStartDate),
            String(profile.referenceTimeMin),
            String(profile.referenceStakesCzk),
          ],
        ],
  )
}

const CHECK_IN_COLUMNS = [
  'check_in_id',
  'user_id',
  'behavior_date',
  'played',
  'time_min',
  'stakes_czk',
  'winnings_czk',
  'submitted_at',
  'updated_at',
] as const

/** `behavior_date` is README's "date YYYY-MM-DD" column — `CheckIn.behaviorDate` itself is now a canonical UTC-midnight timestamp (`refactor(data): store day fields as canonical timestamps`), so it's truncated here rather than passed through raw. */
export function toCheckInCsv(rows: readonly CheckIn[]): string {
  return toCsv(
    CHECK_IN_COLUMNS,
    rows.map((r) => [
      r.checkInId,
      r.userId,
      calendarDate(r.behaviorDate),
      String(r.played),
      String(r.timeMin),
      String(r.stakesCzk),
      String(r.winningsCzk),
      r.submittedAt,
      r.updatedAt ?? '',
    ]),
  )
}

const LIMIT_COLUMNS = [
  'limit_id',
  'user_id',
  'week_no',
  'weekly_limit_time_min',
  'weekly_limit_stakes_czk',
  'limit_set_at',
] as const

export function toLimitCsv(rows: readonly Limit[]): string {
  return toCsv(
    LIMIT_COLUMNS,
    rows.map((r) => [
      r.limitId,
      r.userId,
      String(r.weekNo),
      String(r.weeklyLimitTimeMin),
      String(r.weeklyLimitStakesCzk),
      r.limitSetAt,
    ]),
  )
}

const COPING_STRATEGY_COLUMNS = [
  'coping_strategy_id',
  'user_id',
  'label',
  'type',
  'when_to_use',
  'how_to_start',
  'active',
  'created_at',
  'updated_at',
] as const

export function toCopingStrategyCsv(rows: readonly CopingStrategy[]): string {
  return toCsv(
    COPING_STRATEGY_COLUMNS,
    rows.map((r) => [
      r.copingStrategyId,
      r.userId,
      r.label,
      r.type,
      r.whenToUse ?? '',
      r.howToStart ?? '',
      String(r.active),
      r.createdAt,
      r.updatedAt ?? '',
    ]),
  )
}
