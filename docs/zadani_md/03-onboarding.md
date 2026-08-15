# 03 — Onboarding

Captures the reference week, proposes and confirms week-1 limits, captures
at least one coping strategy, and stamps `intervention_start_date`.

## Inputs (from the user)
- reference time: hours + minutes → `reference_time_min` (int)
- reference stakes: whole CZK → `reference_stakes_czk` (int)
- limit adjustments (see doc 04 for the ceiling rule)
- coping strategy selection (≥1, from a list, ideally + free text)

## Outputs
- complete `profile` record, including `onboarding_completed_at` and
  `intervention_start_date` (next calendar day)
- `limit` record for `week_no = 1`
- app moves to "waiting for day 1" / dashboard state

## Screen flow
```
1. reference week  →  2. proposed limits (editable, capped)  →
3. coping strategy →  4. summary & confirm  →  dashboard
```
Four steps, no more. The brief's stated priority is a narrow, reliable core
over extra polish — onboarding is the first place that priority gets tested.

## Rules
- Reference values are the baseline everything else measures against — they
  are not the limit.
- Proposed limit = 80% of reference, both dimensions (doc 04).
- At least one coping strategy required. Brief's own examples: step outside
  for fifteen minutes, call someone.
- `intervention_start_date` = the day after onboarding completes, always.

## Validation
| Field | Rule | On violation |
|---|---|---|
| hours | int ≥ 0 | block, inline message |
| minutes | 0..59 int | block |
| stakes | int ≥ 0 | block |
| coping | ≥ 1 selected | block continue |

**Zero reference is a legal state**, and the brief says so explicitly: limit
is then 0, no percentage is displayed, and any positive value counts as
exceeded. This is a likely thing the jury pokes at directly — handle it here,
in evaluation (doc 06), and on the dashboard (doc 08), not just in one place.

## Patterns
- Wizard / multi-step form holding a single draft object in memory; persist
  only on final confirm. Keeps a half-written profile from ever existing.
- Command object: `CompleteOnboarding(reference, adjustedLimits, coping,
  now)` → `{profile, limit_week_1}` or a list of validation errors. Pure
  function — the service layer is what persists the result.
- Builder for the draft if partial construction gets awkward in your
  language.
- Two integer fields (h + min) for the time input, not a free-text duration
  parser you then have to validate. Same logic as the 45-second check-in
  budget: fewer decisions, less to get wrong under time pressure.

## Edge cases
- User abandons mid-wizard → nothing written. Next launch restarts
  onboarding; don't try to resume a half-state unless it's genuinely free.
- Onboarding completed at 23:59 → day 1 is still the next calendar day,
  regardless of how close to midnight.
- Re-running onboarding isn't required by the brief, but a hidden "reset
  demo" control earns its keep on stage. Put it in the dev drawer.

## Open questions
- Fixed coping-strategy list acceptable, or does the user need to write
  their own? Brief only requires selecting at least one. Default: fixed
  list plus optional free text.
