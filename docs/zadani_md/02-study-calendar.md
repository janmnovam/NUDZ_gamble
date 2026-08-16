# 02 — Study Calendar (day/week mapping)

Converts between calendar dates and study days/weeks. Build this before
anything else — every other module calls into it.

## Inputs
- `intervention_start_date` (canonical day-start timestamp)
- a calendar date, or a study_day number
- `Clock.today()` — injected, never a bare global call

## Outputs
- `study_day: int` (1..28, plus a marker for out-of-range)
- `week_no: int` (1..4)
- `behavior_date` timestamp for a given study_day
- `currentWeek()`, `isWeekClosed(week_no)`, `isReviewAvailable(week_no)`

## Rules, straight from the brief
- **Day 1** = the first *full* calendar day after onboarding completes. Not
  the onboarding day itself.
- Weeks are individual per user, not calendar weeks and not a rolling
  7-day window: W1 = days 1–7, W2 = 8–14, W3 = 15–21, W4 = 22–28. Users
  don't need to start on the same day, or on a Monday.
- Review for week N unlocks once day 7N has elapsed — review of week 1
  becomes available *during* day 8, even if the day-7 check-in itself is
  still missing.
- After day 28 elapses, the final summary opens during day 29. No
  limit-setting there — just the summary.

## Formulas
```
study_day(date)  = (date - intervention_start_date) + 1        // whole days
week_no(day)     = ceil(day / 7)                                // 1..4
date_of(day)     = intervention_start_date + (day - 1)
first_day(week)  = 7*(week-1) + 1
last_day(week)   = 7*week
```

`study_day` ≤ 0 means onboarding is done but day 1 hasn't started yet.
Handle it explicitly — don't let it silently fall into week 0 or crash a
`ceil` on a non-positive input.

## Derived predicates
```
current_day        = study_day(today)
current_week       = week_no(current_day)
week_is_elapsed(w) = current_day > last_day(w)
review_available(w)= week_is_elapsed(w) && review_for(w) not completed
in_final_summary    = current_day > 28
```

## Patterns
- Pure module, zero I/O, one function per conversion. Cheapest and most
  convincing tests you'll write all weekend.
- Injected Clock interface: `today(): Date`. Real implementation for
  production, fake for tests, and a "demo" implementation whose offset the
  dev drawer can bump — that offset is how the jury travels through weeks
  on a phone.
- Keep a small date-only conversion layer even though the stored values are
  timestamps. Mixing arbitrary instants with calendar days is the classic
  source of off-by-one bugs once timezones enter.

## Edge cases
- Timezone: compute day differences on local calendar dates, not UTC
  instants. `2026-09-01T23:30+02:00` and `2026-09-02T00:30+02:00` are
  different calendar days an hour apart; naive UTC subtraction gets this
  wrong.
- DST transitions: never compute days as `millis / 86400000`. Use calendar
  arithmetic, not millisecond math.
- Day > 28: app keeps working (final summary), doesn't crash or wrap around.
- Onboarding completed at 23:59 → day 1 is still the very next calendar day,
  not "tomorrow, sort of."

## Test cases, write these first
| start | today | expect day | expect week |
|---|---|---|---|
| 2026-09-01 | 2026-09-01 | 1 | 1 |
| 2026-09-01 | 2026-09-07 | 7 | 1 |
| 2026-09-01 | 2026-09-08 | 8 | 2 (W1 review available) |
| 2026-09-01 | 2026-09-28 | 28 | 4 |
| 2026-09-01 | 2026-09-29 | 29 | final summary |

## Open questions
- What happens after day 29 — does the app just sit on the final summary
  indefinitely? Brief doesn't say. Default: yes, stay there, note it in the
  README.
