# 11 — Persistence Layer

Stores everything locally, survives refresh, and stays replaceable by a
server without rewriting the intervention logic. That replaceability is an
explicit requirement in the brief, not a nice architectural gesture — it's
a graded artefact.

## The port — this is the actual deliverable, not the storage engine
```
interface StoragePort {
  loadProfile()            -> Profile | null
  saveProfile(profile)     -> void
  loadLimits()             -> Limit[]
  saveLimit(limit)         -> void          // append-only
  loadCheckIns(from, to)   -> CheckIn[]
  upsertCheckIn(checkin)   -> void          // keyed on behavior_date
  loadReviews()            -> Review[]
  saveReview(review)       -> void
  exportAll()              -> AggregateSnapshot
  reset()                  -> void          // demo control
}
```

Every method returns/accepts domain objects, never storage rows. The
mapping between the two lives entirely in the adapter, not in the calling
code.

## Rules
- Local storage is sufficient, but has to support export and sending data
  (doc 12).
- Data has to survive a refresh — not "usually does," has to.
- Swapping to a server later can't touch layer B, by design, not by luck.

## Engine choice
| Option | Verdict |
|---|---|
| localStorage | Works. String-only, 5 MB, synchronous. A JSON blob rewritten on every check-in. Acceptable fallback, not the first choice. |
| **IndexedDB** | Recommended. Structured, async — which forces you to write the async signatures you'll need for an HTTP adapter anyway — room to grow. |
| SQLite-wasm | Overkill for two days unless you already know it cold going in. |

The async point is architectural, not incidental: build the port
synchronously against localStorage, and the later HTTP adapter can't satisfy
the same interface without touching call sites — which is exactly the
rewrite the brief says must not be necessary. Make the port async from the
start even though today's adapter resolves immediately; costs nothing now.

## Patterns
- Ports & adapters (hexagonal) — the entire point of this module.
- Repository per aggregate; one aggregate here, given one demo user.
- DTO ↔ domain mapping stays in the adapter. Persisted shape is versioned;
  domain shape isn't.
- Schema version field in the stored blob (`schema_version: 1`) plus a
  trivial migration switch. Costs ten minutes to add, and saves you when you
  rename a field at 16:00 on day one and your own seed data stops loading.
- Unit of work / single save point for the review transaction (doc 09).

## Server-swap sketch — put this in the README, it's a scored item
```
LocalIndexedDbAdapter  implements StoragePort
HttpApiAdapter         implements StoragePort   // not built; ~200 lines
   POST /checkins        ← upsertCheckIn
   GET  /checkins?from=  ← loadCheckIns
   ...
Nothing in domain/ or usecases/ changes. Only the composition root
picks a different adapter.
```
Showing the interface and naming the unbuilt adapter, with a rough line
count, is a stronger claim than half-building a backend nobody in the room
can actually run during a 15-minute demo.

## Edge cases
- Storage quota exceeded or private browsing → surface a real error, don't
  fail silently. 28 days for one user is tiny, but IndexedDB can still be
  disabled on the device.
- Concurrent tabs → last write wins, acceptable, just document it.
- Corrupt or absent data on load → fall back to onboarding, don't crash the
  whole app.
- Reset control has to be reachable on the phone, not just from devtools,
  for demo re-runs between judges.

## Open questions
- Does "sending" data mean an actual upload endpoint, or does share/download
  of the CSV count? The export appendix says the download/save mechanism is
  left to the team — so a share sheet or file download should be enough.
  Confirm at kickoff if you want certainty rather than a reasonable
  assumption.
