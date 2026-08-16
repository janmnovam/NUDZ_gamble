# Documentation

Everything written down about NUDZ_gamble, and which document wins when two of
them disagree.

## Start here

| Document | Owns | Authority |
|---|---|---|
| [architecture.md](architecture.md) | The hexagon: layers, every inbound/outbound port, DTO seams, per-port build status | **Authoritative** for structure |
| [data-model.md](data-model.md) | The 7 user tables + the global `contact` table, field names, invariants, Dexie stores | **Authoritative** for the data layer |
| [decisions.md](decisions.md) | Where we knowingly deviate from the brief, and why | **Authoritative** for deviations |
| [../README.md](../README.md) | Stack, commands, scripts, layout, CI/CD, CSV export shape, known gaps | **Authoritative** for tooling |
| [../CLAUDE.md](../CLAUDE.md) | English digest of the domain rules, for contributors and agents | Digest — never the source |
| [../Zadání_Hackathon_2026_shared.docx.md](../Zadání_Hackathon_2026_shared.docx.md) | The assignment as delivered (Czech) | **Authoritative** for requirements |

## Precedence — read this before "fixing" something

1. **The brief wins on requirements** — what the app must do, what the data means.
2. **Unless [decisions.md](decisions.md) records a deviation.** If the code contradicts
   the brief, check there before treating it as a bug. Two deviations are recorded today:
   day 1 is the onboarding day, and the CSV export is raw tables rather than person-day
   rows. Both were deliberate.
3. **architecture.md and data-model.md win on shape** — how the code is arranged and how
   rows are stored. The brief does not prescribe either.
4. **CLAUDE.md is a digest.** When it disagrees with the brief or with these docs, the
   digest is what's wrong.

The one thing no document may contradict: cumulative usage, net loss, weekly totals and
overall status are **derived from source records + limit history, never stored**.

## Reference pack — [zadani_md/](zadani_md/)

The brief split into 16 numbered module docs (Czech/English mix), each with the same
Inputs / Outputs / Rules / Patterns / Edge cases / Open questions shape. Start at
[00-INDEX-AND-ARCHITECTURE.md](zadani_md/00-INDEX-AND-ARCHITECTURE.md).

Code comments cite these by number — "doc 02" means
[02-study-calendar.md](zadani_md/02-study-calendar.md), "doc 05" means
[05-checkin.md](zadani_md/05-checkin.md), and so on. **This pack is a copy of the
assignment: don't edit it to match the code.** If the code diverges, that belongs in
[decisions.md](decisions.md).

| # | Doc | Owns |
|---|---|---|
| 01 | [domain-model](zadani_md/01-domain-model.md) | Entities, field names, invariants |
| 02 | [study-calendar](zadani_md/02-study-calendar.md) | Day 1–28, week 1–4, what "today" means |
| 03 | [onboarding](zadani_md/03-onboarding.md) | Reference week, coping strategy, start date |
| 04 | [limits](zadani_md/04-limits.md) | 80 % proposal, 90 % ceiling, per-week history |
| 05 | [checkin](zadani_md/05-checkin.md) | Daily entry, backfill, missing vs. zero |
| 06 | [evaluation-engine](zadani_md/06-evaluation-engine.md) | Weekly aggregation, the three statuses |
| 07 | [feedback](zadani_md/07-feedback.md) | Immediate response after check-in, coping prompt |
| 08 | [dashboard](zadani_md/08-dashboard.md) | Read model, surfacing missing days |
| 09 | [weekly-review](zadani_md/09-weekly-review.md) | Close week, set next limits, incomplete flag |
| 10 | [reminders](zadani_md/10-reminders.md) | One working notification scenario |
| 11 | [persistence](zadani_md/11-persistence.md) | Storage port, swap-to-server requirement |
| 12 | [export-csv](zadani_md/12-export-csv.md) | Person-day CSV, exact columns |
| 13 | [testing-and-seed](zadani_md/13-testing-and-seed.md) | Required tests, reference scenario numbers |
| 14 | [pwa-shell](zadani_md/14-pwa-shell.md) | Mobile delivery, refresh survival |
| 15 | [submission-checklist](zadani_md/15-submission-checklist.md) | Licences, README, demo |

Note doc 12 describes the person-day export the app deliberately does **not** produce —
see [decisions.md](decisions.md).

## Working material — not documentation of the code

- [Tests.txt](Tests.txt) — a hand-written 29-day scenario (limits per week, which days are
  filled, backfilled or left missing) used to exercise the demo by hand. Test *data*, not
  a test plan.
- [design/Hackathon2026Figma.fig](design/Hackathon2026Figma.fig) — the Figma file the UI
  was built from, agreed with the team and the clinicians. The reference for any visual
  question the docs don't answer; see
  [architecture.md § Design source](architecture.md#design-source) for how to treat it.

## Diagrams

[data-model.md](data-model.md) embeds a Mermaid ER diagram, which renders on GitHub.
[data-model.svg](data-model.svg) and [data-model.png](data-model.png) are exported copies
for printing and slides — regenerate them if the Mermaid source changes, or they will
quietly disagree with it.
