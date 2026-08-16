import { expect, test } from '@playwright/test'

import { CheckInPage } from './pom/CheckInPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { ReportsPage } from './pom/ReportsPage'
import { ReviewPage } from './pom/ReviewPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * CSV export — the mandatory "raw tables" ZIP (four CSVs: profile, check_in,
 * limit, coping_strategy), triggered from the reports tab. Asserts the archive
 * shape and the deliberate raw-dump rules from CLAUDE.md: a missing day has no
 * row (never a zero row), a no-play day is a real zeros row, `is_backfill` is a
 * derived boolean, and each week keeps its own historical limit row.
 */

const PROFILE_COLUMNS = [
  'user_id',
  'onboarding_completed_at',
  'intervention_start_date',
  'reference_time_min',
  'reference_stakes_czk',
]
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
  'is_backfill',
]
const LIMIT_COLUMNS = [
  'limit_id',
  'user_id',
  'week_no',
  'weekly_limit_time_min',
  'weekly_limit_stakes_czk',
  'limit_set_at',
]

let onboarding: OnboardingPage
let dashboard: DashboardPage
let checkin: CheckInPage
let review: ReviewPage
let reports: ReportsPage
let timeMachine: TimeMachine

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  checkin = new CheckInPage(page)
  review = new ReviewPage(page)
  reports = new ReportsPage(page)
  timeMachine = new TimeMachine(page)

  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

// --- Suite A: archive shape -------------------------------------------------

test.describe('A · archive shape', () => {
  test('A1 · the ZIP holds the four raw tables; a missing day has no row', async () => {
    await reports.open()
    const { filename, names, csv } = await reports.downloadExport()

    expect(filename).toMatch(/^nudz-export-\d{4}-\d{2}-\d{2}\.zip$/)
    expect(names.sort()).toEqual(
      ['check_in.csv', 'coping_strategy.csv', 'limit.csv', 'profile.csv'].sort(),
    )

    // Headers are the stable snake_case contract researchers read.
    expect(csv('profile.csv').header).toEqual(PROFILE_COLUMNS)
    expect(csv('check_in.csv').header).toEqual(CHECK_IN_COLUMNS)
    expect(csv('limit.csv').header).toEqual(LIMIT_COLUMNS)

    // Profile: exactly one row, carrying the reference week.
    const profile = csv('profile.csv')
    expect(profile.rows).toHaveLength(1)
    expect(profile.cell(profile.rows[0], 'reference_time_min')).toBe('600')
    expect(profile.cell(profile.rows[0], 'reference_stakes_czk')).toBe('10000')

    // Week-1 limit is present.
    const limit = csv('limit.csv')
    expect(limit.rows).toHaveLength(1)
    expect(limit.cell(limit.rows[0], 'week_no')).toBe('1')
    expect(limit.cell(limit.rows[0], 'weekly_limit_time_min')).toBe('480')
    expect(limit.cell(limit.rows[0], 'weekly_limit_stakes_czk')).toBe('8000')

    // No check-ins yet → the table is headers only. A missing day is NOT a row.
    expect(csv('check_in.csv').rows).toHaveLength(0)
    // One coping strategy was chosen at onboarding.
    expect(csv('coping_strategy.csv').rows).toHaveLength(1)
  })
})

// --- Suite B: check-in rows -------------------------------------------------

test.describe('B · check-in rows', () => {
  test('B1 · a no-play day is a zeros row; a played day carries its values', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 1, stakes: 5_000 }) // day 1, played
    await dashboard.expectVisible()

    await timeMachine.jumpToDay(3)
    await dashboard.startCheckIn()
    await checkin.answerNotPlayed() // day 2, no-play
    await dashboard.expectVisible()

    await reports.open()
    const check = (await reports.downloadExport()).csv('check_in.csv')
    expect(check.rows).toHaveLength(2)

    const played = check.row('played', 'true')
    const noPlay = check.row('played', 'false')

    expect(check.cell(played, 'time_min')).toBe('60')
    expect(check.cell(played, 'stakes_czk')).toBe('5000')

    // A no-play day is a valid record of zeros — not the same as a missing day.
    expect(check.cell(noPlay, 'time_min')).toBe('0')
    expect(check.cell(noPlay, 'stakes_czk')).toBe('0')
    expect(check.cell(noPlay, 'winnings_czk')).toBe('0')
  })

  test('B2 · is_backfill distinguishes a next-morning check-in from a late one', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.answerNotPlayed() // day 1, filed on day 2 → not a backfill
    await dashboard.expectVisible()

    await timeMachine.jumpToDay(4)
    await dashboard.backfillOldestMissingDay() // day 2, filed on day 4 → backfill
    await checkin.answerNotPlayed()
    await dashboard.expectVisible()

    await reports.open()
    const check = (await reports.downloadExport()).csv('check_in.csv')
    expect(check.rows).toHaveLength(2)

    const flags = check.rows.map((r) => check.cell(r, 'is_backfill')).sort()
    expect(flags).toEqual(['false', 'true'])
  })
})

// --- Suite C: limit history -------------------------------------------------

test.describe('C · limit history', () => {
  test('C1 · each week keeps its own limit row (previous limits are not overwritten)', async () => {
    await timeMachine.confirm(8) // week-1 review
    await review.adjustTimeHours(-2) // next week 8 h → 6 h
    await review.setStakes(5_000)
    await review.save()
    await dashboard.expectVisible()

    await reports.open()
    const limit = (await reports.downloadExport()).csv('limit.csv')
    expect(limit.rows).toHaveLength(2)

    const week1 = limit.row('week_no', '1')
    const week2 = limit.row('week_no', '2')
    expect(limit.cell(week1, 'weekly_limit_time_min')).toBe('480')
    expect(limit.cell(week1, 'weekly_limit_stakes_czk')).toBe('8000')
    expect(limit.cell(week2, 'weekly_limit_time_min')).toBe('360')
    expect(limit.cell(week2, 'weekly_limit_stakes_czk')).toBe('5000')
  })
})
