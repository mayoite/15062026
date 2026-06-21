# Phase 4 — Catalog, Templates, and Blueprint

## Status: 7/15 done · 4 source-fixed/browser-pending · 4 need E2E

## Done
- **P4-03** Catalog card accessible names ✅
- **P4-06** Dimension conversion unit tests (planner-catalog-blockBridge.test.ts) ✅
- **P4-08** Template happy path (unique ids, coords, room-size units) ✅ source
- **P4-09** Template existing-plan confirmation guard ✅
- **P4-11** Blueprint file input validation (20 MB limit, errors) ✅ source
- **P4-12** Blueprint calibration (two-point capture, mmPerUnit) ✅ source
- **P4-13** Blueprint persistence regression test ✅ source
- **P4-14** Resource cleanup (no createObjectURL for blueprints) ✅
- **P4-15** BUG-04 double-serialization fix ✅

## Source-fixed / browser proof pending
- **P4-08** Template browser proof pending
- **P4-11** Blueprint browser proof pending
- **P4-12** Blueprint browser proof pending
- **P4-13** Blueprint SVG exclusion browser proof pending

## Remaining (need E2E)
- [ ] P4-01 Catalog load states
- [ ] P4-02 Search/filter
- [ ] P4-04 Placement click → canvas count
- [ ] P4-05 Drag/drop placement
- [ ] P4-07 Recents persist
- [ ] P4-10 Template undo

## Exit gate
Catalog/template/blueprint paths produce correct content or specific error; BUG-04 resolved.
