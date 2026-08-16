# Design source

`Hackathon2026Figma.fig` — the Figma file the app's UI was built from, agreed with the
team and the clinicians. Open it with **File → Import** in Figma (desktop or web); the
`.fig` format restores the whole file, including components and frames.

It is the reference for any visual question the written docs don't answer — the dashboard
and the reports screens were built frame-by-frame from it.

**Treat it as a checkpoint, not a working copy.** It is an 8.4 MB binary: Git stores a
whole new copy on every commit and cannot merge two people's edits. Re-export and commit
it when the design changes materially, not on every tweak. If it ever needs real revision
history, move it to Git LFS at that point.
