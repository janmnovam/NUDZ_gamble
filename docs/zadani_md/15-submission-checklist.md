# 15 — Submission, Licensing & Checklist

## What actually gets submitted
- repository with readable history
- running app *or* a reproducible build per the README
- architecture and data-model description
- tests
- a statement of what's done and what was deliberately left out
- known limitations and technical debt
- a proposal for what to finish before a pilot
- seed data for the reference scenario
- short live demo

Notice the shape of that list: over half of it is documentation and honest
scoping, not code. Write the README incrementally starting Saturday morning
— a README written at 13:20 Sunday reads exactly like what it is.

## Licensing rules — hard constraints, not suggestions
- Output goes open source under MIT. Anything you put in the repo has to be
  legally releasable under MIT, no exceptions.
- Permissive libraries only: MIT, BSD, ISC, Apache 2.0, zlib, CC0.
- Forbidden: GPL, AGPL, LGPL, and anything share-alike or non-commercial
  (e.g. CC BY-SA, CC BY-NC).
- Stack Overflow snippets are CC BY-SA — share-alike. Don't copy them
  verbatim; rewrite in your own words if you're borrowing the idea.
- AI assistants are permitted. You vouch for generated code to the best of
  your knowledge, and you have to declare which tools you used at
  submission — not optional, stated as a requirement.
- Your own older code only if it's permissively licensed. No company or
  proprietary code in this repo, under any circumstances.
- Graphics, fonts, icons, sounds: CC0, freely licensed, or your own work.
  Respect attribution requirements for CC BY.
- Preserve original licence headers in any adopted code, and list
  dependencies with their licences in the README.
- No private keys, personal data, or production credentials in the repo —
  full stop, no "just for the demo" exception.
- If you're unsure about a licence, ask the organisers before deploying that
  component, not after.

### Licence traps specific to this app
- Chart libraries — check before adding one for the bonus graph feature.
- Icon sets — a lot of the popular ones are CC BY (attribution required),
  and some are CC BY-SA (forbidden here). Check each one individually.
- Fonts — most Google Fonts are OFL/Apache and fine, but verify anything
  else you pull in.
- Date libraries — the common ones are MIT, but check rather than assume.
- A `LICENSE` file (MIT) has to be in the repository root.

## README skeleton — fill this in as you go, not at the end
```
# <app name>
## What it does
## Architecture (layers A/B/C, port diagram)
## Data model (the four entities + derived values)
## Running it / build
## Seed data & how to load it
## Demo controls (advance day, fire reminder, reset)
## CSV export: delimiter, decimal separator, encoding, NA policy
## Rounding rule for limit percentages
## Simplifications (reminder trigger, etc.)
## Known limitations & technical debt
## What to finish before a pilot
## Dependencies and their licences
## AI tools used
```

## Timeline pressure points, from the actual programme
| When | What |
|---|---|
| Sat 09:30–10:00 | Questions & scope confirmation — ask your open questions here, not later |
| Sat 12:45–13:00 | 5–8 min checkpoint: tech, data model, day simulation, risks |
| Sat 17:30–18:00 | 15 min checkpoint: full first pass — reference → limits → one check-in → feedback → dashboard |
| Sun 11:30 | New feature development stops. Fixes, stabilisation, docs, demo prep only from here |
| Sun 13:30–14:30 | Code freeze & submission |
| Sun 15:00–15:50 | 15 min demo + 10 min Q&A |

The 17:30 Saturday checkpoint defines Saturday's scope precisely: build
onboarding → limits → check-in → feedback → dashboard, and nothing beyond
that on day one. Review, export, reminders, and tests are Sunday-morning
work, by design of the schedule itself.

New features stop at 11:30 Sunday, not at the freeze at 13:30. Your actual
development window is closer to 11 hours than the 16 the two-day framing
suggests — scope everything against that real number.

## Questions worth asking at 09:30 Saturday
1. Do both teams have the same assignment, or genuinely different ones?
2. Export before day 28 — do future days appear as rows, and with what
   status?
3. Rounding rule for the 80/90% calculations — floor, round, or does it not
   matter to them?
4. Does "export and send" require an actual upload endpoint, or is
   download/share sufficient?
5. Are extra CSV columns beyond the stated minimum acceptable?
6. Can the reference week be edited after onboarding completes?

## Demo script, 15 minutes — rehearse it once before Sunday afternoon
1. 60s — architecture: three layers, the port, why the logic is pure
2. 60s — load seed, show the reference-scenario dashboard (73% / 81% /
   POZOR)
3. 3 min — one check-in end to end, feedback with the coping-strategy
   reminder
4. 2 min — the week strip: a zero day sitting next to a missing day,
   backfill one of them live
5. 2 min — advance the clock, open the week review, set new limits right at
   the cap
6. 2 min — export the CSV, open it, point at the missing row's empty fields
7. 2 min — run the test suite live, on stage
8. 2 min — known limitations, and what you'd do before a pilot

Steps 4, 6, and 8 are where you separate from a team that just built a
prettier UI on the same spec — lead with the distinctions the brief itself
cares about, not the ones that are easiest to show.
