# STK Daily Report 2.0 — Audit & Fix Report

Date: 2026-08-09
Scope: `index.html` (single-file offline app) — audited with a real user backup
(`ics-report-backup-2026-08-09.json`, 112 MB) plus simulated 30-day workload.

## Summary

Six confirmed flaws were found, fixed in `index.html`, and verified with 16
end-to-end Playwright tests (all passing). A 30-day stress simulation on top of
the real backup completed with zero data loss, zero ID collisions, and a full
export → restore roundtrip.

| # | Severity | Flaw | Status |
|---|----------|------|--------|
| 1 | High (crash) | Weekly preview crashes after reload: `r.byDate.get is not a function` (Map is not JSON-safe) | Fixed |
| 2 | High (data loss) | Duplicate-project merge drops `progressReports` / `beritaAcara` | Fixed |
| 3 | High (wrong data) | Daily form date field is ignored — draft keyed on toolbar `activeDate` | Fixed |
| 4 | High (wrong data) | `startOfWeek`/`addDays`/`today` shift dates in UTC+ zones (week starts Sunday) | Fixed |
| 5 | Medium (collision) | `generateDailyReportId` uses count+1 instead of max+1 → duplicate IDs | Fixed |
| 6 | Medium (wrong qty) | Voice "ribu"/"juta" parsed as unit word, not multiplier ("seratus ribu" → 100) | Fixed |

## Fix Details

1. **Weekly crash after reload** — `generateWeeklyWorkforceSummary`,
   `saveWeeklyEdit` built `byDate` as a `Map`; after JSON roundtrip it becomes a
   plain object and `r.byDate.get(...)` in `workforceSummaryPage` throws. Now
   `byDate` is a plain object everywhere and a `byDateVal` helper reads both
   shapes.
2. **Merge data loss** — `migrateDuplicateWeeklyProjects` remapped projects and
   dailies but left `progressReports` / `beritaAcara` pointing at the deleted
   project. Added remapping of both collections via `idMap`.
3. **Date divergence** — `ensureDailyDraft` keys the daily by `activeDate`, so a
   date typed in the form was silently ignored (draft created under the toolbar
   date instead). The form date input now syncs `activeDate` (and resets
   `editingDailyId`) on change; draft, save, and report ID all follow the form
   date. The toolbar date input already had this behavior and is now the single
   source of truth.
4. **Timezone shift** — `startOfWeek`/`addDays`/`today` used `Date` math with
   ISO strings, shifting dates in UTC+ zones (e.g. Asia/Jakarta computed the
   week as Sunday..Sunday). Added a local-YMD helper; all three now return
   local calendar dates.
5. **Report ID collision** — IDs were numbered by counting existing reports for
   the day; deleting the latest report reused its ID. Now `generateDailyReportId`
   computes `max(existing numeric suffixes for same project+date) + 1`, ignoring
   legacy non-numeric suffixes.
6. **Voice quantities** — "ribu" / "juta" were consumed as the unit name (e.g.
   "seratus ribu rupiah" → qty 100). `parseIndoNumberSequence` now treats them
   as multipliers ("seratus ribu" → 100,000; "lima juta" → 5,000,000).

Additional hardening found during audit: `deleteProject` now also removes the
project's `beritaAcara` (it already removed progress reports); weekly period
override survives re-renders and is only cleared when the user edits the period
inputs.

## Real Backup Findings (112 MB, 2026-08-09)

- 2 projects, 1 survey, 16 dailies, 2 weeklies, 233 photos — all inline `data:`
  URLs (~72.5 MB); the app offloads these to IndexedDB on load (`idb:` refs).
- **Two dailies share the same date** (2026-07-28) — allowed by the current data
  model (keys are `projectId + date` via `ensureDailyDraft`, but duplicates can
  still be created through PDF import / merge paths); no duplicate `reportId`s.
- Legacy report IDs exist (`DR-20260708-K429`, `DR-20260728-XEIH`) — the new
  max+1 generator handles them correctly.
- Older weekly (2026-07-26 → 28) has no `workforceSummary`; preview safely
  falls back to `generateWeeklySummaryFromDailyReports`. Newer weekly has
  `workforceSummary` with `byDate` already a plain object.
- No `progressReports` / `beritaAcara` entries in the backup (feature unused by
  this user).

## Verification (Playwright, headless Chromium)

16 tests, all passing (~45 s):

- T1–T3: app load, project create, survey → project → daily conversion.
- T4–T5: daily full save + IDB offload; weekly generation + reload
  (previously crashed on `byDate.get`).
- T6–T9: progress report, berita acara, backup/restore, daily PDF export.
- T10–T11: voice parser edge cases (incl. ribu/juta), timezone-aware
  `startOfWeek` (Asia/Jakarta → Monday).
- T12–T13: merge keeps progressReports/BA; report ID max+1 (next = 004).
- T14: form date is respected end-to-end (`DR-20260805-001`).
- T15: restores the real 112 MB backup; 233 photos hydrate with 0 `idb:` leaks;
  weekly opens with no errors.
- T16 (stress): 30 simulated days on top of the real backup → 46 dailies, 6
  weeklies, 323 photos, 0 report ID collisions; reload + hydration clean;
  `backupJSON()` export and restore roundtrip preserve all counts.

## Files

- `index.html` — all fixes applied (single-file app).
- Tests/helpers used for verification live outside the repo.
