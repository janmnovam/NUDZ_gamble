# 08 — Dashboard

The home screen. Shows current limits, running weekly consumption,
percentage utilisation, and — mandatory — missing data with a way to fill
it in.

## Inputs
- profile, current `limit`, current week's check-ins
- `Clock.today()` → current study day/week (doc 02)
- `WeekEvaluation` (doc 06)

## Outputs (read model — compute this, never store it)
```
DashboardVM {
  study_day, week_no
  limits: { time_min, stakes_czk }
  time:   { used, pct, status, remaining }
  stakes: { used, pct, status, remaining }
  overall_status
  days: [ { study_day, date, state: completed|backfilled|missing|future,
            played?, time_min?, stakes_czk? } ]   // 7 entries
  missing_days: [dates]        // only days ≤ today−1
  pending_action: checkin_due | review_available | final_summary | none
}
```

## Mandatory elements (straight from the brief)
- limits
- week progress / running consumption
- percentage utilisation
- missing data, shown, with an offer to fill it in — not optional, stated
  as a requirement

## Rules
- Percentages come from the weekly limit, not the reference.
- A week with any missing record has to say so — this isn't a nice-to-have,
  it's called out explicitly.
- Only days ≤ today−1 can be "missing." Future days in the week are "not
  yet due," and counting them as missing would be wrong, not just
  imprecise.
- Backfill status is never shown to the user — a backfilled day looks
  exactly like a timely one, everywhere in the UI.

## Patterns
- CQRS-lite / read model: one function builds the whole view-model from
  source records. No stored aggregates — matches the brief's explicit
  instruction that totals are computed, not persisted.
- State pattern for `pending_action`: exactly one primary call-to-action at
  a time, resolved by a fixed priority order:
  ```
  final_summary  >  review_available  >  checkin_due  >  none
  ```
  Deciding this order once, in one place, is what stops you from ending up
  with two competing buttons on the same screen by hour six — a genuinely
  common hackathon UI failure.
- Week strip component: 7 cells, four visual states. This one component
  does most of the work of demonstrating "missing ≠ zero" visually — a grey
  NA cell sitting next to a "0 min" cell makes the point to a jury faster
  than any sentence in your README will.

## Layout priority (phone, above the fold)
1. Primary action (check-in due / review ready)
2. Both status bars, with remaining amounts
3. Week strip, missing days tappable
4. Everything else

## Edge cases
- Before day 1 (onboarding done, day 1 hasn't started): show a waiting
  state, not a broken 0/0 week.
- Day 29+: dashboard yields to the final summary entirely.
- Zero limits: no percentage bar, just a plain "limit 0" state.
- All seven days missing: the strip is all NA, and the overall status must
  not read as a clean OK week just because there's nothing to sum.

## Open questions
- Should previous weeks be visible from the dashboard (history)? Not
  required. Bonus territory, only once the core loop is solid and stable.
