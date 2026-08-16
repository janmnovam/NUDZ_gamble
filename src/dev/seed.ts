/**
 * Dev-only DB seeding, wired to `window.__seed` from `main.tsx` behind
 * `import.meta.env.DEV`. Never bundled into a production build.
 *
 * Writes straight through the outbound repositories (`createDataLayer()`),
 * bypassing every inbound service/guard — same shortcut the test suite
 * takes, just aimed at the real IndexedDB so a scenario can be eyeballed in
 * the browser instead of asserted in Jest.
 *
 * `today` picks which study day "today" (the real wall clock) should land
 * on: `interventionStartDate` is backdated from the real calendar date so
 * `createStudyCalendar` (src/domain/clock.ts) derives that day without any
 * TimeMachineClock — the clock/guard code is untouched.
 */
import { createDataLayer } from '@/core/index.ts'
import { calendarTimestamp } from '@domain/clock.ts'
import type { CheckIn, Limit, Profile, Review } from '@domain/model.ts'
import { newId } from '@data/ids.ts'
import { COPING_STRATEGY_DEFAULTS } from '@data/seeds/copingDefaults.ts'

export interface SeedCheckIn {
  /** Study day, 1..28. */
  day: number
  played: boolean
  /** Ignored (stored as 0) when `played` is false. */
  timeMin?: number
  stakesCzk?: number
  winningsCzk?: number
  /** Defaults to the morning after `day`; pass an earlier/later ISO instant to simulate a backfill. */
  submittedAt?: string
}

export interface SeedLimit {
  weekNo: number
  timeMin: number
  stakesCzk: number
}

export interface SeedReview {
  weekNo: number
  incomplete?: boolean
  limitChanged?: boolean
}

export interface Scenario {
  /** Which study day the real "today" should land on. */
  today: number
  referenceTimeMin: number
  referenceStakesCzk: number
  limits: SeedLimit[]
  checkIns: SeedCheckIn[]
  reviews?: SeedReview[]
}

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

/**
 * The **local** calendar date (`YYYY-MM-DD`), matching how the app derives
 * "today" from the offset-bearing `clientNow()` (src/ui/clock.ts). Using the
 * UTC date here instead would backdate `interventionStartDate` by a day for any
 * viewer east of UTC during the local-evening window, shifting every study day
 * by one — which is exactly what breaks the reference scenarios near midnight.
 */
function todayDate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function seedScenario(scenario: Scenario): Promise<void> {
  const data = createDataLayer()
  const userId = newId()
  await data.databaseAdmin.clearUserData(userId)

  const startDate = addDays(todayDate(), -(scenario.today - 1))
  const interventionStartDate = calendarTimestamp(startDate)

  const profile: Profile = {
    userId,
    onboardingCompletedAt: `${addDays(startDate, -1)}T21:00:00.000Z`,
    interventionStartDate,
    referenceTimeMin: scenario.referenceTimeMin,
    referenceStakesCzk: scenario.referenceStakesCzk,
  }
  await data.profiles.save(profile)

  const defaultCoping = COPING_STRATEGY_DEFAULTS[0]
  if (defaultCoping) {
    await data.copingStrategies.create(
      { userId, label: defaultCoping.label, type: 'default', priority: 1 },
      `${addDays(startDate, -1)}T21:00:00.000Z`,
    )
  }

  for (const l of scenario.limits) {
    const limit: Limit = {
      limitId: newId(),
      userId,
      weekNo: l.weekNo,
      weeklyLimitTimeMin: l.timeMin,
      weeklyLimitStakesCzk: l.stakesCzk,
      limitSetAt: `${addDays(startDate, 7 * (l.weekNo - 1) - 1)}T08:00:00.000Z`,
    }
    await data.limits.save(limit)
  }

  for (const c of scenario.checkIns) {
    const behaviorDate = addDays(startDate, c.day - 1)
    const checkIn: CheckIn = {
      checkInId: newId(),
      userId,
      behaviorDate: calendarTimestamp(behaviorDate),
      weekNo: Math.ceil(c.day / 7),
      played: c.played,
      timeMin: c.played ? (c.timeMin ?? 0) : 0,
      stakesCzk: c.played ? (c.stakesCzk ?? 0) : 0,
      winningsCzk: c.played ? (c.winningsCzk ?? 0) : 0,
      submittedAt: c.submittedAt ?? `${addDays(behaviorDate, 1)}T08:00:00.000Z`,
      updatedAt: null,
    }
    await data.checkIns.save(checkIn)
  }

  for (const r of scenario.reviews ?? []) {
    const review: Review = {
      reviewId: newId(),
      userId,
      reviewWeekNo: r.weekNo,
      reviewCompletedAt: `${addDays(startDate, 7 * r.weekNo)}T09:00:00.000Z`,
      limitChanged: r.limitChanged ?? false,
      incomplete: r.incomplete ?? false,
    }
    await data.reviews.save(review)
  }
}
