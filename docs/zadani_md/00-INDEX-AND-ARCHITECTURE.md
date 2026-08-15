# 00 — Index & Architecture

Reference pack for the DigiWELL gambling self-control app. Language-agnostic
on purpose — decide the stack, this stays valid. Every module doc has the
same shape: Inputs / Outputs / Rules / Patterns / Edge cases / Open
questions. Edit "Open questions" and "Decisions" live, during checkpoints,
whenever something gets confirmed or changed.

## Module index

| # | Doc | Owns |
|---|-----|------|
| 01 | domain-model | Entities, field names, invariants |
| 02 | study-calendar | day 1–28, week 1–4, what "today" means |
| 03 | onboarding | reference week, coping strategy, start date |
| 04 | limits | 80% proposal, 90% ceiling, per-week history |
| 05 | checkin | daily entry, backfill, missing vs. zero |
| 06 | evaluation-engine | weekly aggregation, three statuses |
| 07 | feedback | immediate response after check-in, coping prompt |
| 08 | dashboard | read model, missing-day surfacing |
| 09 | weekly-review | close week, set next limits, incomplete flag |
| 10 | reminders | one working notification scenario |
| 11 | persistence | storage port, swap-to-server requirement |
| 12 | export-csv | person-day CSV, exact columns |
| 13 | testing-and-seed | required tests, reference scenario numbers |
| 14 | pwa-shell | mobile delivery, refresh survival |
| 15 | submission-checklist | licences, README, demo |

## Layer split (this is in the brief, not my invention)

> "Oddělte vrstvy: A) rozhraní, B) intervenční logika, C) data." — separate
> the layers: A) interface, B) intervention logic, C) data.

```
   A) UI / presentation
        |  calls, never contains rules
        v
   B) intervention logic  (pure, no I/O, no clock access)
        |  asks through an interface
        v
   C) data  (local now, server later, no rewrite of B)
```

Layer B can't import storage, can't call `now()`, can't touch DOM/framework.
Time enters as an argument, always. Get this right and the four mandated
tests (doc 13) fall out almost for free, and the storage swap (doc 11)
becomes a config change instead of a rewrite.

### Dependency direction

```
UI ──▶ AppService (use-cases) ──▶ Domain (pure functions)
                 │
                 └──▶ StoragePort (interface) ──▶ LocalAdapter | HttpAdapter
```

- Domain: pure functions + value objects. No `await` anywhere in here.
- AppService: the only place that knows both domain and storage. Loads
  state, calls domain, persists result.
- StoragePort: an interface with ~6 methods. One adapter now, one you name
  but don't build for the swap story.
- Clock: injected, `Clock.today()`. Never a bare global date call anywhere
  in domain or app-service code.

### Why bother with this on a two-day hackathon

The brief says invention is wanted in architecture and execution, not in the
logic — the logic is fully specified, down to the exact percentages. So the
layering, the port, the injected clock, and the pure-function test suite
*are* the differentiator, and the thing to walk the jury through in the
15-minute demo, not an afterthought before the Q&A.

## Decide these in the first hour, not the third

| Decision | Options | Recommendation |
|---|---|---|
| Storage engine | localStorage / IndexedDB / SQLite-wasm | IndexedDB — structured, async, room to grow |
| State shape | event log vs. current-state records | Records, per the brief's four tables |
| Derived values | stored vs. computed | Computed. Brief explicitly forbids storing them |
| Time source | system clock vs. injectable + demo override | Injectable, with a dev "advance day" control |
| ID strategy | UUID vs. incremental | UUID — painless server merge later |
| Money type | integer CZK | Integer only, no floats, anywhere |
| Time type | integer minutes | Integer minutes, format only at display time |

## The one thing that will break everything else if you get it wrong

Not the UI. The date/day mapping (doc 02) plus missing ≠ zero (doc 05). Every
other rule in this spec routes through those two. Build and test them first;
if either is wrong, dashboard, review, and export are all wrong
simultaneously, and you won't notice until the demo.

## The demo needs a time machine

The jury clicks through on a phone, no code access. You need an in-app way to
fast-forward days — a dev drawer button, not a hack. Build it as a feature of
the injected clock from day one; it's also how you'll test weeks 2–4 and the
review flow yourself without waiting 21 real days.
