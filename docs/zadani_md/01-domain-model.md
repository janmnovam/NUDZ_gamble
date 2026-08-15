# 01 — Domain Model

Field names below are copied verbatim from the brief. Don't rename them —
the jury will look for them by name, and the export spec (doc 12) depends on
these exact names.

## profile (one record, one demo user)
| Field | Type | Notes |
|---|---|---|
| user_id | string | e.g. `A001` in seed data |
| onboarding_completed_at | timestamp | ISO 8601 with timezone |
| intervention_start_date | date | = day after onboarding completed |
| reference_time_min | int minutes | weekly reference |
| reference_stakes_czk | int CZK | weekly reference |
| coping_strategy | string / list | at least one chosen |

## limit (one record per week, append-only — never overwritten)
| Field | Type | Notes |
|---|---|---|
| week_no | 1..4 | |
| weekly_limit_time_min | int | ≤ 90% of reference_time_min |
| weekly_limit_stakes_czk | int | ≤ 90% of reference_stakes_czk |
| limit_set_at | timestamp | |

## check-in (one record per reported day)
| Field | Type | Notes |
|---|---|---|
| behavior_date | date | the day the data describes |
| played | bool | |
| submitted_at | timestamp | when actually sent |
| updated_at | timestamp | last edit, nullable |
| time_min | int | 0 when played=false |
| stakes_czk | int | 0 when played=false |
| winnings_czk | int | recorded, never affects limit status |

## review (one per closed week)
| Field | Type | Notes |
|---|---|---|
| review_week_no | 1..4 | |
| review_completed_at | timestamp | |
| limit_changed | bool | |
| incomplete | bool | true if closed with missing check-ins |

## What's explicitly NOT stored — compute on read, every time
Running consumption, net loss, weekly totals, overall status, `is_backfill`.
The brief is explicit that these come from the source records plus limit
history. Storing any of them is a scoring risk, not a shortcut — it's the
kind of thing a technical jury checks by editing seed data and reloading.

`is_backfill` is one comparison: calendar date of `submitted_at` >
`behavior_date` + 1 day.

## Invariants — assert these, don't just hope for them
1. `played == false` ⟹ `time_min == 0 && stakes_czk == 0`
2. At most one check-in per `behavior_date` — unique key
3. `weekly_limit_* ≤ 0.90 × reference_*`, for every week, always
4. Exactly one `limit` record per `week_no`; earlier ones never mutate
5. `winnings_czk` never enters a limit calculation, anywhere
6. No record for a day ≠ a zero record for that day. Two distinct states,
   never conflate them.

## Patterns worth using
- Value objects for `Minutes` and `Czk`. Both are plain integers, which is
  exactly how you end up silently comparing minutes to crowns somewhere —
  wrapping them stops the compiler (or at minimum, code review) from letting
  that through.
- Aggregate root: treat `profile + limits + checkins + reviews` as one
  aggregate for the single demo user. Makes local saving transactional for
  free — one blob, one write, no partial state.
- Repository per entity, or one repository for the whole aggregate. Given
  one user, one aggregate repository is simpler and just as correct.
- Immutable records: an edit produces a new object with a new `updated_at`,
  not a mutation in place.

## Type discipline
Money and time: integers, always. Percentages are the only place a float
belongs, and they're computed at evaluation/display time — never persisted.
Round for display only; classify status on the raw ratio, or you'll get a
79.6% that displays as "80%" while classifying as OK, and that inconsistency
is exactly the kind of thing that gets noticed on stage.

## Open questions
- One coping strategy or several? Brief says "at least one" — model it as a
  list, confirm at Saturday kickoff whether multi-select matters.
- Can the reference week be edited after onboarding? Not addressed. Default
  to no, note it as a known limitation in the README.
