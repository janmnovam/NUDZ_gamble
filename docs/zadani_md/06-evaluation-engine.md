# 06 — Evaluation Engine (statuses)

Aggregates a week's check-ins and classifies consumption against both
limits. This is the core of layer B, and where two of the four mandatory
tests live.

## Inputs
- list of check-ins for the week (possibly incomplete)
- the `limit` record for that `week_no`
- reference values, for display only

## Outputs
```
WeekEvaluation {
  time:   { used_min, limit_min, pct, status, remaining_min }
  stakes: { used_czk, limit_czk, pct, status, remaining_czk }
  overall_status
  missing_days: [dates]
  has_missing: bool
  net_loss_czk        // display only, not a limit input
}
```

## Rules
- Statuses: OK < 80%, POZOR 80–100% inclusive, PŘEKROČENO > 100%.
- Computed separately for time and stakes.
- Overall status = the worse of the two.
- UI always shows both values, and exactly how much specifically remains —
  not just a status badge.
- Percentages come from the weekly limit, not the reference.
- The limit binds to stakes only, never winnings. Winnings feed net loss
  only and have zero effect on limit status — the brief's stated reasoning
  is that the user controls what they wager, not the outcome of the game.
- Any week with a missing record must say so on the dashboard.

## Formulas
```
used_time   = Σ time_min   over existing check-ins in the week
used_stakes = Σ stakes_czk over existing check-ins in the week
net_loss    = Σ stakes_czk − Σ winnings_czk        // display only

pct(used, limit) = limit > 0 ? used / limit : (used > 0 ? EXCEEDED : OK)

status(pct):
   pct <  0.80              → OK
   0.80 <= pct <= 1.00      → POZOR
   pct >  1.00              → PŘEKROČENO

overall = max(status_time, status_stakes)      // ordered OK < POZOR < PŘEKROČENO
remaining = max(0, limit − used)               // decide: clamp or show negative
```

Missing days contribute nothing to the sums — they're NA, not zero. Which
means the sums are lower bounds, and `has_missing` has to travel alongside
every percentage you show, not sit off to the side as a footnote.

## Boundary discipline — test these explicitly, don't eyeball them
| used / limit | pct | expected |
|---|---|---|
| 383 / 480 | 79.79% | OK |
| 384 / 480 | 80.00% | POZOR (lower bound is inclusive) |
| 480 / 480 | 100.00% | POZOR (upper bound is inclusive) |
| 481 / 480 | 100.2% | PŘEKROČENO |

Classify on the raw ratio, format for display separately. Round to an
integer percent before classifying and 79.6% displays as "80%" while the
badge says OK — a visible contradiction the moment someone checks your math.

## Reference scenario — must reproduce these exact numbers
```
limits : 480 min | 8 000 CZK
used   : 350 min | 6 500 CZK
→ time   73%  OK
→ stakes 81%  POZOR
→ overall     POZOR
```
Check it: 350/480 = 72.9% → displays 73%; 6500/8000 = 81.25% → displays
81%. Both round down here — whatever display-rounding rule you pick, verify
it reproduces both numbers, not just one.

## Patterns
- Pure function: `evaluateWeek(checkins, limit) → WeekEvaluation`. No I/O, no
  clock. This one signature carries most of your test suite.
- Enum + total ordering for status; `overall = max(...)` becomes one line
  and self-documents the "worse of the two" rule.
- Strategy pattern isn't needed here — thresholds are constants, not
  swappable policies. Resist over-abstracting; the brief explicitly rewards
  narrow and reliable over clever.
- Keep the 0.80/1.00 thresholds in the same constants module as the
  80%/90% limit percentages from doc 04. One source of truth for every
  magic number in the spec.

## Edge cases
- Limit = 0 (zero reference): no percentage shown, any positive usage is
  PŘEKROČENO, zero usage is OK. Never divide by it.
- Week with zero check-ins: used = 0, but `has_missing = true` for all seven
  days. Don't let this render as a triumphant "0% — OK" — that's the exact
  failure mode the brief calls out.
- Negative remaining: show "0 remaining" or "−60 min over"? Showing the
  overage is more informative and matches "how much specifically remains."
- Partial week in progress ("průběžné čerpání" in the brief — running
  consumption): same computation, just fewer elapsed days. Don't pro-rate
  the limit itself; it's weekly and whole regardless of how far into the
  week you are.

## Open questions
- Should the dashboard distinguish "missing" from "not yet due"? Days after
  today haven't happened, so they aren't missing. Only days ≤ today−1
  qualify as missing — implement it that way, it's the only reading that's
  internally consistent with the rest of the spec.
