# Phase 5 — Persistence and File Lifecycle

## Status: 12/18 done · 6 need E2E/integration

## Done
- **P5-01** DATA_FLOW.md architecture doc written ✅
- **P5-09** Replacement guard (confirm before applyPlannerDocument when unsaved) ✅
- **P5-10** Export JSON URL.revokeObjectURL ✅
- **P5-11** parsePlannerDocumentImportFile unit tests ✅ (planner-persistence.test.ts)
- **P5-12** localStorage corruption recovery unit tests ✅
- **P5-14** Draft TTL expiry unit tests ✅
- **P5-15** Guest migration decision matrix unit tests ✅
- **P5-16** Privacy (no fetch in guest persistence paths) ✅
- **P5-17** Version migration (normalizePlannerDocument) ✅ source
- **P5-02** createAutoSaver factory shape + cancel unit tests ✅ (planner-autosave.test.ts)
- **Existing:** P5-guestToAuth migration (8 tests), P5-draft (4 tests) ✅

## Remaining
- [ ] **P5-02** `PlannerSaveStatus` UI state (idle/unsaved/saving/saved/error) — needs integration
- [ ] **P5-03** Refresh timing (autosave debounce) — needs E2E
- [ ] **P5-04** Local draft save scope-key isolation test — needs unit test
- [ ] **P5-05** Cloud save mock Supabase integration test
- [ ] **P5-06** Session load (local + cloud) — needs integration
- [ ] **P5-07** Session list merge (local + cloud) — needs integration
- [ ] **P5-08** Session delete (local + cloud) — needs integration
- [ ] **P5-13** IndexedDB error recovery (loadProject rejection) — needs integration
- [ ] **P5-18** Legacy IndexedDB migration — needs integration

## Exit gate
No accepted mutation lost in normal refresh; all 6 data-loss invariants tested.
