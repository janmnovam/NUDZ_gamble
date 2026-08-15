# 12 — CSV Export (person-day)

User-triggerable export, person-day granularity: one row per planned day
1–28, including no-play days *and* days with no check-in at all. This has
its own appendix in the brief — treat it as a spec to match exactly, not a
rough guideline.

## Inputs
- profile, all check-ins, all limits
- the 28-day calendar (doc 02) — the row set comes from the calendar, not
  from whatever records happen to exist

## Output
One CSV, stable column names, UTF-8. 28 rows for a full run, always — not
"as many rows as there's data for."

## Required columns, verbatim
```
user_id, intervention_start_date, study_day, week_no, behavior_date,
checkin_status, played, time_min, stakes_czk, winnings_czk,
submitted_at, updated_at, is_backfill
```

## checkin_status values
At minimum: `completed`, `missing`, `backfilled`.

| Case | status | played | numerics | timestamps |
|---|---|---|---|---|
| logged on time | completed | true/false | real / zeros | filled |
| no-play day | completed | false | **0, 0, 0** | filled |
| logged late | backfilled | true/false | real / zeros | filled |
| never logged | missing | **empty/NA** | **empty/NA** | **empty/NA** |

**The one rule in this whole doc that matters most:** for `missing`, every
one of played/time/stakes/winnings/timestamps stays empty or uniformly
marked NA. They do not get replaced with zeros. The brief states this
explicitly, and it's the entire reason the export exists in this shape —
it's what makes the dataset analysable downstream instead of silently lying
about zero-play days that were actually just unrecorded.

## Example, straight from the brief
```
A001,1,1,2026-09-01,completed,false,0,0
A001,2,1,2026-09-02,missing,,,
A001,3,1,2026-09-03,backfilled,true,60,500
```

## Conventions — recommended by the brief, document your choice in README
- UTF-8
- dates `YYYY-MM-DD`
- timestamps ISO 8601, including timezone
- `time_min` in whole minutes
- amounts in whole CZK
- decimal separator and CSV delimiter must be described in the README —
  not left implicit

The delimiter question is a real one in a Czech context: Excel with a Czech
locale expects `;`, not `,`. Pick one, state it, and consider a UTF-8 BOM so
Excel doesn't mangle diacritics on open. Mentioning this in the demo signals
you thought about who actually opens the file afterward, not just whoever
generates it.

## Generation algorithm
```
rows = []
for day in 1..28:
    date   = date_of(day)
    ci     = checkins[date]              // may be absent
    status = ci ? (is_backfill(ci) ? backfilled : completed) : missing
    rows.append(project(day, date, ci, status))
emit(header + rows)
```
Iterate the calendar, then look up the record — not the other way around.
Iterating records and trying to backfill gaps afterward is exactly how
missing days quietly disappear from the export.

## Patterns
- Left join over a generated date spine. The 28-day spine drives the whole
  thing; records are looked up against it, not the reverse.
- Pure projection function: `(day, date, checkin|null) → row`. Fully
  testable without touching a file. Serialisation is a separate concern,
  kept separate.
- NA policy as a single constant: one place decides whether missing renders
  as `""` or `NA`, applied consistently — the spec explicitly asks for
  "uniformly marked."

## Edge cases
- Exporting before day 28 → still emit all 28 rows. Future days: the spec
  says one row per *planned* day 1–28, but future days haven't happened yet,
  so labelling them `missing` is arguably wrong. Recommendation: emit all 28
  rows, and either restrict `missing` to already-elapsed days with a
  distinct `future`/NA status for the rest, or pick one behaviour and write
  it down explicitly. This is the one genuine ambiguity in the appendix —
  worth raising at the Saturday checkpoint rather than guessing silently.
- Fields containing separators or diacritics → proper quoting/escaping,
  every time, not just when it happens to matter for your seed data.
- `updated_at` null for never-edited records → empty, consistently, same
  NA policy as everything else.

## Open questions
- Extra columns beyond the minimum allowed? "Minimální pole" (minimum
  fields) implies yes. Adding `limit_time_min` / `limit_stakes_czk` per row
  makes the file self-contained for downstream analysis — cheap to add, and
  a good thing to point at during the demo.
