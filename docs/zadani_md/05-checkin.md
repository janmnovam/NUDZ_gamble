# 05 — Daily Check-in & Backfill

Records one day's behaviour in ~45 seconds, allows backfilling missing days
in the *current* week only, and keeps "missing" strictly separate from
"didn't play."

## Inputs
- `behavior_date` (default: yesterday)
- `played: bool`
- if played: `time_min`, `stakes_czk`, `winnings_czk`

## Outputs
- persisted check-in record, with `submitted_at` (and `updated_at` on edit)
- immediate feedback payload (doc 07)
- dashboard invalidation

## Rules
- The daily check-in is for the previous calendar day by default. First
  question is always "did you play yesterday?"
- No → store zeros, record is valid and complete. This is not a skip — it's
  a real, filled-in record.
- Yes → collect time, stakes, winnings.
- Timely = submitted during the day following `behavior_date`. Anything
  later is a backfill — recorded as such internally, but **never shown to
  the user**, and it doesn't change how the form behaves.
- Backfill is allowed for any still-missing day of the *current* week only.
- Check-ins for a closed week can't be added or edited, period.
- A missing day is not a zero day. Missing = NA, and the app has to actively
  surface it — on the dashboard, and through a notification.

## The three states of a day
| State | Record exists | played | numeric fields |
|---|---|---|---|
| completed | yes | true/false | real values or zeros |
| backfilled | yes | true/false | real values or zeros |
| missing | **no record** | — | NA / empty, never 0 |

`backfilled` is a derived label on an existing record, not a separate stored
state: `date(submitted_at) > behavior_date + 1 day`.

## State machine per day
```
        (day elapses)
missing ─────────────▶ missing (still open, current week)
   │  user submits
   ▼
completed / backfilled ──user edits──▶ updated_at set
   │
   │ (week closes)
   ▼
locked  ── no add, no edit ──
```

## Validation
| Field | Rule |
|---|---|
| time_min | int ≥ 0, sane upper bound (≤ 1440) |
| stakes_czk | int ≥ 0 |
| winnings_czk | int ≥ 0 |
| behavior_date | must be in current week, must be ≤ today − 1 |
| played=false | forces all three numerics to 0 |

Don't validate stakes against the limit here — exceeding the limit is a
legal, expected outcome that produces a status (doc 06), not a form error.

## Patterns
- Command + handler: `SubmitCheckIn(behaviorDate, played, values, now)`.
  Pure validation and record construction; the service persists.
- Guard clause / policy object: `CanEditPolicy(behavior_date, today,
  intervention_start_date)` → allowed / locked-week / future-date. One
  policy, reused by the form, the dashboard's "fill in" links, and the
  review flow — don't reimplement the same check three times.
- Upsert semantics keyed on `behavior_date`, never a duplicate.
- Skip the null-object pattern here — representing a missing day as a
  zero-filled record is precisely the bug the brief warns against. Absence
  has to stay absence, all the way through to the dashboard and the export.

## UI notes (the 45-second budget)
- One big yes/no question first. "No" completes the whole flow in one tap.
- "Yes" reveals three numeric inputs on the same screen, not three separate
  screens.
- Numeric keypad input mode. Pre-fill nothing except the date.

## Edge cases
- User opens the app twice in one day → second submit is an edit, sets
  `updated_at`, doesn't create a duplicate.
- Backfilling day 3 while today is day 6 → allowed, flagged internally,
  invisible to the user.
- Backfilling a day from week 1 while already in week 2 → refused, week's
  closed. Refuse visibly, don't just silently ignore the tap.
- Check-in for today (not yesterday) isn't covered by the brief. Default to
  disallowing current/future-day entry, note it in the README.

## Open questions
- Can a check-in from an *open* week be edited freely, or only a missing one
  filled in? Brief implies free edits — `updated_at` exists specifically for
  "the user's most recent edit." Default: edits allowed within the open
  week.
