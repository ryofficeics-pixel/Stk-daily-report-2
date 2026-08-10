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

---

# Stress-Test Audit Round 2 — 2026-08-10

Method: Playwright + headless Chromium at `http://127.0.0.1:8811/`, static
source scan + 16 dynamic scenarios (A–N) driving the app's globals directly
and via the real UI (forms, autosave, delete flows, restore fuzz).

## New Findings

| # | Severity | Flaw | Evidence | Status |
|---|----------|------|----------|--------|
| 7 | High (data integrity) | BA numbers reuse deleted numbers: `generateBANumber` uses count+1 of current BA records, so deleting BA-0001 then creating a new BA yields a duplicate. Same pattern previously fixed for daily report IDs. | Repro: create BA-0001, BA-0002 → delete BA-0001 → create → list `["BA-0002","BA-0002"]` | Fixed |
| 8 | Medium (data integrity) | Weekly Report left stale after deleting a daily: `deleteDailyReport` strips the id from `sourceDailyReportIds` but never regenerates the weekly, so `summaryData.dailySnapshots` and `autoSummary` still contain the deleted day (and its data appears in the weekly PDF). | `sourceIdsAfterDelete=["drD1"]`, `snapshotsAfterDelete=2`, `autoSummaryHasDay2=true` | Fixed |
| 9 | Low | After an IndexedDB write failure the app persists `idb:` refs in localStorage whose blobs never got written; if the user ignores the on-screen warning and reloads, those photos become permanent broken `idb:key` strings. UI does warn ("jangan tutup tab ini"). | `idbPutAll` rejected → `photoRef:"idb:b1okeuj_120023"` survives reload unchanged | Fixed |
| 10 | Low (UX) | Multiple dailies on the same date are allowed but the editor always loads the first match; the 2nd+ same-date daily is only reachable through preview. Report IDs stay unique (`DR-…-001/002`). | 2 dailies 2026-08-05, editor opens first | Fixed |
| 11 | Low | No `storage` event listener → no cross-tab sync; two open tabs last-write-wins, silently losing concurrent edits. | `hasStorageListener:false` | Fixed |
| 12 | Info | `fmtDate("2026-02-29")` rolls to `1 Mar 2026` (invalid date auto-corrected by JS `Date`). Low reach (date-picker inputs). | — | Fixed |

## Round 2 Fixes (all verified)

- **#7** — `generateBANumber` now mirrors the daily-report-ID fix: `max(existing BA numeric suffix) + 1`, ignoring legacy non-numeric numbers. After delete, no reuse. Verify: delete BA-0001 → new = `BA-0003`, no collision.
- **#8** — new `resyncWeeklyAfterDailyChange(weeklyId)` regenerates `summaryData`/`autoSummary`/`sourceDailyReportIds` from the week's current dailies; `deleteDailyReport` calls it for every weekly that referenced the deleted daily. Verify: after delete, `snapshots=1`, `autoSummary` no longer mentions the deleted day. Note: this regenerates the whole weekly from live dailies, so it also picks up any sibling edits made since generation.
- **#9** — `hydrateIdbRefs` returns `null` for missing blob keys and a new `dropNullUrlEntries` prune removes photos whose blob is gone during `load()`. Verify: after forced IDB failure + reload, the broken `idb:` literal no longer persists (the unwritable photo is dropped; user is still warned at save time).
- **#10** — when a date has multiple dailies the editor shows a picker (report ID + progress) above the form; selecting one loads that exact report. Verify: 2 dailies on 2026-08-05 → picker shows `DR-S-01`, `DR-S-02` → selecting the 2nd loads its text.
- **#11** — `storage` event listener reloads the tab when another tab writes a *different* value; a `lastWrittenStorageValue` guard prevents reload loops on the tab's own writes/echoes. Verify: foreign change reloads, own-echo does not.
- **#12** — `fmtDate` validates Y-M-D components strictly; invalid dates like `2026-02-29` render as the raw string instead of rolling to `1 Mar 2026`.

## Verified Safe (stress checks passed)

- **False-success save paths**: forced IndexedDB failure and forced
  localStorage quota error both show explicit failure status; the app never
  displays "Tersimpan" when persistence failed.
- **Delete cascade (project)**: surveys unlinked to `survey_only`, all
  project records removed, IndexedDB blobs cleaned (`1 → 0` keys), UI re-renders.
- **Weekly aggregation integrity**: material totals, equipment days,
  workforce, weather, photo count, and snapshots all match independent
  hand-calculated values.
- **Duplicate weekly (same period)**: confirm-dialog updates the existing
  record, count stays 1.
- **XSS / HTML injection**: `<img onerror>` and `<script>` payloads in project
  name/location and progress text are fully escaped in list, editor, and
  textarea (no live elements, no JS execution, no console/page errors).
- **Restore fuzz**: invalid JSON, string, `{}`, wrong schema, `null`, orphan
  `projectId` refs, duplicate ids — no crash, app renders, orphans filtered.
- **ID generation**: daily report IDs `001/002/003` sequential per
  project+date, no reuse after delete (`→004`); `uid()` unique over 1000 calls.
- **Autosave**: text typed without pressing save is recovered after reload
  (1800 ms debounce works).
- **Large input**: 100k-char progress + 60 materials + 8 large photos: save +
  reload intact, no errors.
- **PDF previews**: daily (photo + materials) and weekly render; export
  regression suite still green.
- **Performance**: repeat `save()` does ~0 ms sync work (blob-hash cache).

## Final Scores (1–10)

Pre-fix: Data integrity 7 · Storage 8 · PDF export 9 · Performance 9 ·
Security 9 · UX 8 · **Overall 8/10**.

Post-fix: Data integrity 9 · Storage 9 · PDF export 9 · Performance 9 ·
Security 9 · UX 9 · **Overall 9/10**.

## What Breaks First

Pre-fix: deleting a Berita Acara then creating a new one produces a duplicate
BA number, and deleting a Daily after generating its Weekly leaves the deleted
day's data in the weekly PDF. Both are now fixed (#7, #8). The next most likely
user-visible issue is same-date dailies being awkward to edit (#10) and
unwritable photos being dropped after an IndexedDB failure (#9) — both now
handled with clear UI.
