# 09 — Weekly Review & Final Summary

After days 7, 14, and 21, review the week just ended and set both limits for
the next one. After day 28, show a final summary with no limit-setting.

## Inputs
- `week_no` being closed
- that week's check-ins and `limit`
- reference values (for the 90% ceiling)
- list of missing days in the closing week

## Outputs
- `review` record: `{review_week_no, review_completed_at, limit_changed,
  incomplete}`
- a new `limit` record for `week_no + 1` (except after week 4)
- the reviewed week becomes closed: its check-ins are locked permanently

## Rules
- Review of week N becomes available once day 7N has elapsed — week 1's
  review normally opens during day 8, even if the day-7 check-in itself is
  missing.
- New limits are again capped at 90% of the *original* reference (doc 04).
- Previous limits are never overwritten; each week keeps its own record.
- If the closing week has missing check-ins, the app has to offer to fill
  them in *first*, before anything else.
- The user can complete the review anyway — it's then stored with
  `incomplete = true`, and the week closes regardless.
- After day 28, during day 29, the final summary opens: no limits for a next
  week, and it also has to be completable with missing check-ins.

## Flow
```
review_available(N)
   ├─ missing days in week N?
   │     yes → offer backfill (still editable until review completes)
   │             ├─ user fills → continue
   │             └─ user declines → incomplete = true
   └─ show week summary (both dimensions, statuses, totals)
        → set limits for week N+1 (proposed, capped at 90% of reference)
        → confirm
             → write review record
             → write limit record for N+1
             → CLOSE week N (checkins locked)
```

## The ordering trap — this is the one to get right
Backfill for week N has to stay possible *until the review completes*,
because it's the review that closes the week. If you lock the week purely
on "day 7N has elapsed," the brief's own required step — offer to fill
missing days before reviewing — becomes structurally impossible to satisfy.

So: **a week is closed by its completed review, not by the calendar.**

Make `isWeekClosed(N) = review_for(N).completed`, and make the check-in edit
policy (doc 05) depend on that flag, not on the day number. This is the
single most likely place in the whole spec to get subtly wrong, because the
naive reading of "review after day 7" points you at the calendar first.

## Patterns
- Transactional use-case: the review record, the next limit, and the week
  closing all have to land together. With one local aggregate, save once at
  the end — don't write three times and risk a half-closed week if
  something fails midway.
- Reuse the limit calculator and ceiling validator from doc 04 verbatim. If
  you catch yourself writing a second 90% check here, stop — it's the same
  rule, applied at a second call site.
- Guard on availability: `canReview(week_no, today, reviews)` — pure,
  testable, drives both the dashboard CTA and the route guard, one
  implementation for both.
- Idempotency: reviewing the same week twice has to be impossible. Key the
  review record on `review_week_no` and enforce it.

## Edge cases
- Review for week 1 opened during day 12 (user ignored it for days) — still
  valid; week 2's new limits then apply to a week already partway underway.
  Brief doesn't forbid this. Decide the behaviour and write it down —
  recommend applying the new limit as normal and noting the lateness as a
  known limitation.
- Two reviews pending at once (user absent 10+ days): present them oldest
  first. Don't let week 2's review happen before week 1's.
- Week 4 review: no limit setting, final summary instead — different screen,
  not the same screen with a step hidden.
- All days missing in the closing week: review still completable,
  `incomplete = true`, totals shown NA-aware rather than as zero.

## Open questions
- Does a late-completed review retroactively change which week the current
  day belongs to? No — week membership is date-driven (doc 02) and
  independent of review completion. Double-check you've kept these two
  concepts separate in code, since it's an easy thing to accidentally
  couple.
