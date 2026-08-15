# 04 — Limits (proposal, ceiling, history)

Computes the proposed weekly limits, enforces the adjustment ceiling, and
keeps one immutable historical record per week. Two of the four mandatory
automated tests (doc 13) target this module directly.

## Inputs
- `reference_time_min`, `reference_stakes_czk`
- user-adjusted values (optional)
- `week_no` being set

## Outputs
- `{ weekly_limit_time_min, weekly_limit_stakes_czk, limit_set_at }` for one
  `week_no`
- a validation result if the user tried to go above the ceiling

## Rules
- Proposal = 80% of reference, both time and stakes.
- Ceiling = 90% of reference, both. User can go lower freely, never higher.
- 80% and 90% must be **centrally managed constants** — the brief says this
  explicitly. One config module, referenced everywhere, never inlined as a
  magic number in three different files.
- The ceiling is always relative to the *original* reference, not to last
  week's limit. Week 4's cap is still 90% of the reference set at
  onboarding.
- Limits get set at onboarding (week 1) and at each review (weeks 2, 3, 4).
- Previous limits are never overwritten — one historical record per week,
  full stop.

## Reference scenario — the jury will check this exact set of numbers
```
reference : 600 min (10 h)   |  10 000 CZK
proposed  : 480 min ( 8 h)   |   8 000 CZK   (80%)
ceiling   : 540 min ( 9 h)   |   9 000 CZK   (90%)
```

## Formulas
```
proposed(ref) = round(ref * DEFAULT_LIMIT_PCT)   // 0.80
ceiling(ref)  = round(ref * MAX_LIMIT_PCT)       // 0.90
valid(v, ref) = 0 <= v <= ceiling(ref)
```

**Pick a rounding rule and write it down.** With integers, 80% of 601 is
480.8 — floor, round, or ceil all give different, equally defensible
answers. Recommend floor, so you never propose above intent, but the actual
choice matters less than applying it *identically* everywhere the
percentage shows up. Inconsistent rounding between proposal and ceiling is
exactly the kind of thing a technical jury catches by hand-checking your
seed data.

## Zero reference
Reference 0 → limit 0, ceiling 0. No percentage displayed at all. Any
positive recorded value is exceeded. Guard the division before every single
percentage computation — don't rely on catching it once.

## Patterns
- Pure calculator function + a constants/config module. The two mandated
  tests target exactly this pair, nothing more.
- Specification/validator object for the ceiling rule, reused by both
  onboarding and weekly review — same rule, two call sites, one
  implementation. Don't let a second, slightly-different 90% check creep in
  at the review screen.
- Append-only history for limit records. Treat the collection as a log:
  lookup is `limitFor(week_no)`, there is no update path at all.
- Slider or stepper UI with hard bounds derived from `ceiling()`, so the
  invalid state is unreachable in the UI — but validate in the domain layer
  regardless, because the UI is not the actual guard.

## Edge cases
- User sets a limit of 0 on purpose → legal, going lower is always allowed.
  Every positive value then counts as exceeded.
- Reference small enough that 80% and 90% round to the same integer → legal,
  no special casing needed, but don't assert `proposed < ceiling` anywhere
  in tests.
- Review somehow skipped → week has no limit record. Decide: inherit
  previous week's limit and flag it, or block progress. Recommend inherit +
  flag, and write the decision down.

## Open questions
- Displayed percentage for a limit is relative to the reference (80/90%),
  but the *status* percentage is relative to the limit — confirmed by the
  brief, status % is computed from the weekly limit, not the reference. Two
  different denominators appearing in the same screen: label them clearly,
  or the jury will read them as contradicting each other.
