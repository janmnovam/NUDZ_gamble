# 13 — Testing & Seed Data

Satisfies the four mandatory automated tests and provides seed data that
reproduces the reference scenario on the jury's phone in one tap.

## Mandatory automated tests, verbatim from the brief
1. Financial and time limit proposal = 80% of the reference week
2. Financial and time limit ceiling = 90% of the reference week
3. The three statuses
4. At least one case with a missing record

All four target pure functions in layer B. If your architecture is right,
none of them needs storage, a DOM, or a network — write them and confirm
that. If any of them does, that's a real signal the layering slipped
somewhere, not just a testing inconvenience.

## Test matrix to actually write

### Limits (doc 04)
| ref time | ref stakes | expect proposal | expect ceiling |
|---|---|---|---|
| 600 | 10 000 | 480 / 8 000 | 540 / 9 000 |
| 0 | 0 | 0 / 0 | 0 / 0 |
| 1 | 1 | rounding rule applies — pin the expected value explicitly |

Plus: adjusting above the ceiling is rejected, adjusting below is accepted.

### Statuses (doc 06)
| used | limit | pct | expect |
|---|---|---|---|
| 383 | 480 | 79.8% | OK |
| 384 | 480 | 80.0% | POZOR |
| 480 | 480 | 100% | POZOR |
| 481 | 480 | 100.2% | PŘEKROČENO |
| 1 | 0 | n/a | PŘEKROČENO (zero-limit rule) |
| 0 | 0 | n/a | OK |

### Missing record (docs 05, 06, 12)
- week with 6 check-ins + 1 missing day → `has_missing = true`, missing day
  listed, sums exclude it entirely
- the missing day exports as `checkin_status = missing` with empty
  numerics, not zeros
- a no-play day exports as `completed`, `played=false`, zeros — assert
  these two rows are different, not just that each one individually looks
  fine

### Calendar (doc 02) — not mandated, write it anyway
The five-row table from doc 02. Cheapest bugs to catch here, most expensive
ones to debug once they've propagated into the dashboard and export.

## Seed data
The brief states the exact reference scenario they want to see on your seed
data:
```
reference : 600 min | 10 000 CZK
proposed  : 480 min |  8 000 CZK
ceiling   : 540 min |  9 000 CZK
current   : 350 min |  6 500 CZK
→ 73% OK  /  81% POZOR  /  overall POZOR
```

Build the seed so loading it lands the app mid-week in exactly that state,
plus:
- at least one no-play day (zeros, completed)
- at least one missing day
- at least one backfilled day
- ideally, week 1 already closed with a completed review, so the jury can
  see limit history without waiting around for you to demo it live

One seed exercising every one of these at once means one tap covers the
whole spec. Make it a button in the dev drawer, reachable on the phone
itself, not something you type into a console.

## Demo-time simulation
The jury clicks through the loop on a phone, no code access. Needed
controls in the dev drawer, clearly labelled:
- Load seed / reset
- Advance one day (bumps the injected clock offset)
- Fire test reminder

Advancing the clock is what makes "another day, the cycle repeats" and "the
weekly review" demoable inside a 15-minute slot at all — without it there's
no way to show the review flow. Build the clock offset on day one, not
Sunday morning under time pressure.

## Patterns
- Fake clock implementing the same `Clock` interface as production.
- Test data builders (`aCheckIn().onDay(3).played(60, 500)`) — hackathon
  test code gets rewritten constantly as the spec understanding shifts;
  builders make that cheap instead of painful.
- Golden-file test for the CSV: assert the entire rendered output against
  an expected string. One test catches column order, separators, NA
  policy, and quoting all at once, instead of four separate assertions that
  can each individually pass while the file is still wrong.

## What to skip
No E2E/browser automation, no mocking frameworks, no coverage targets. Four
mandated areas plus the calendar, all as fast unit tests. Anything beyond
that is time not spent on the core loop — and the brief is explicit that the
core loop is the priority over everything else.
