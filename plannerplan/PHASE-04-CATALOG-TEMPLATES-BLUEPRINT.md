# Phase 4 — Catalog, Templates, and Blueprint

## Goal

Make every content-entry path place correct, recoverable, accurately scaled planner objects. Fix BUG-04 (double serialisation on save) in this phase.

---

## Bug to fix in this phase

### BUG-04 — Double `buildCurrentPlannerDocument` on save
**File:** `features/planner/editor/PlannerWorkspace.tsx` lines ~753–777

`handleSaveDraft` and `handleSaveAsNewSession` each call `buildCurrentPlannerDocument()` inside the callback body, re-serialising the Fabric canvas on every save click. The memoised `currentPlannerDocument` on line 690 is not reused.

**Fix:**
```ts
// BEFORE (both handlers):
const draftDocument = buildCurrentPlannerDocument();

// AFTER:
const draftDocument = currentPlannerDocument; // already memoised
```
Add an integration test that confirms `exportDraft` is called exactly once per save action (use a spy or mutation counter on the Fabric canvas).

---

## Catalog audit

- Purpose filter from setup, all categories, keyword search, no-results state, recents list, and malformed/missing catalog items.
- Click placement and drag/drop placement: at canvas center, near edges, at different zoom levels, and on invalid drop targets (outside canvas).
- Product image load failure, missing 2D block SVG, missing dimensions, duplicate IDs, and unavailable remote catalog.
- After placement: verify stored `name`, category, `widthMm`, `heightMm`, `depthMm`, seat count, source ID, and 3D bridge mapping.

---

## Template audit

- Every template's: preview renders, selection shows correct name/seat count, application places the correct objects with correct dimensions.
- Apply to: blank canvas, canvas with existing objects.
- Undo after template application must restore previous state completely.
- Repeated application of the same template must not accumulate phantom objects.
- Template object IDs must not collide with each other within a single template.

---

## Blueprint audit

- File inputs: PNG, JPEG, PDF (single and multi-page), invalid extension (`.exe`), corrupt file, oversized file (> 20 MB), no file selected.
- Calibration: valid reference line capture, invalid line (< 3 px), unit selection, scale calculation correctness, recapture, reset.
- Underlay controls: move, opacity slider, visibility toggle, trace guide overlay, remove, reload after save.
- Blueprint must NOT be included in SVG/PNG export (it is an underlay reference, not plan content).
- Blueprint data URL must be stored in `workspaceStore.blueprint.dataUrl` and survive save/reload.

---

## Task checklist

- [ ] **P4-01 Catalog load:** loading spinner, success (≥ 1 item), empty state, remote fetch failure, and local fallback behavior. *(needs E2E)*
- [ ] **P4-02 Search/filter:** case-insensitive match, SKU/name/material/tag match, no result, purpose tab switching, subcategory filter. Each filter change must update the visible item count. *(needs E2E)*
- [x] **P4-03 Card semantics — duplicate `Add` button fix:** already correct. Both buttons on each catalog card already have unique accessible names: `aria-label={\`Add ${enriched.shortName} to canvas\`}` and `aria-label={\`Quick place ${enriched.shortName}\`}` (CatalogPanel.tsx:339/352). No change needed. Axe scan still required to confirm zero duplicate names at runtime.
- [ ] **P4-04 Placement — click:** clicking an item calls `placeCatalogIntoFabric`, which calls `insertObject`. Assert canvas object count increases by 1. Assert `recordRecentPlacement` is called with the item ID. *(needs E2E)*
- [ ] **P4-05 Placement — drag/drop:** drag from catalog panel onto canvas center. Assert drop flash appears. Assert canvas object increases by 1. Assert dropped outside canvas does nothing. Assert rapid drag cancel does not leave ghost state. *(needs E2E)*
- [ ] **P4-06 Canonical mapping:** for a fixture catalog item, assert after placement: `obj.name` contains the item title, `obj.width` ≈ `widthMm / 10`, `obj.height` ≈ `heightMm / 10`. Assert the placed item appears in the 3D bridge document with matching dimensions. *(needs integration)*
- [ ] **P4-07 Recents:** after placing an item, the item appears first in the recents list. Placing the same item again does not duplicate the entry. Maximum count is respected. Reload: recents persist. Missing product (deleted from catalog): recents gracefully omits or shows degraded state. *(needs E2E)*
- [~] **P4-08 Templates — happy path:** for each template, assert: `insertObject` called with ROOM type at the correct dimensions, each shape placed with correct `widthMm`/`heightMm`, canvas object count matches `template.shapes.length + 1` (room + shapes). *(source fixes added: unique template ids, explicit coordinates, corrected room-size units, preview count test passing; browser proof pending)*
- [x] **P4-09 Templates — existing plan policy:** `handleApplyTemplate` now checks `shapeCount > 0` before applying. Shows `window.confirm` with count of existing objects ("replace / cancel"). If user cancels, canvas is unchanged. `shapeCount` added to callback deps.
- [ ] **P4-10 Templates — undo:** after applying a template, one `Ctrl+Z` must restore the previous canvas state completely. Assert object count and serialized geometry. *(needs E2E)*
- [~] **P4-11 Blueprint — file input:** PNG, JPEG, and single-page PDF accepted. Multi-page PDF: only page 1 used (with notification). Invalid extension: inline error. Corrupt file: inline error. Oversized: inline error with size limit stated. *(20 MB limit now enforced centrally; inline missing/oversize/unsupported messages present; browser proof pending)*
- [~] **P4-12 Blueprint — calibration:** two-point line capture, real-world distance input (default 3000 mm), `mmPerUnit` calculated and stored in `workspaceStore`. After recalibration, `mmPerUnit` updates. Reset clears `mmPerUnit`. *(canvas capture and move overlay now wired; browser proof pending)*
- [~] **P4-13 Blueprint - persistence:** after save, reload, blueprint `dataUrl`, `x`, `y`, `scale`, `opacity`, and `mmPerUnit` all restore to stored values. Blueprint is NOT visible in SVG export (assert SVG string does not contain the blueprint data URL). *(document bridge regression test now covers persisted blueprint workspace fields; SVG/browser proof pending)*
- [~] **P4-14 Resource cleanup:** blueprint uses base64 data URLs (FileReader.readAsDataURL / pdfPageToDataUrl) — no `URL.createObjectURL` is called, so no `revokeObjectURL` needed. PDF.js worker terminate: deferred to P6 resource-cleanup audit. Object URL tracking N/A for blueprint path. *(PDF worker terminate needs P6 integration test)*
- [x] **P4-15 BUG-04 fix + test:** `handleSaveDraft` and `handleSaveAsNewSession` now use `currentPlannerDocument` (memoised on line 690) instead of calling `buildCurrentPlannerDocument()` fresh. Dependency arrays updated. Eliminates double Fabric canvas serialization per save click.

---

## Acceptance artifacts

- Catalog fixture: JSON file with 3 items of known dimensions, used in placement and canonical-mapping tests.
- Template report: for each template, expected vs. actual room dimensions and object count.
- Blueprint fixture pack: `valid.png`, `valid.pdf`, `invalid.exe`, `corrupt.pdf`.

---

## Primary files

- `features/planner/catalog/` (all files)
- `features/planner/editor/PlannerWorkspace.tsx` ← BUG-04
- `features/planner/editor/templates/TemplatePickerModal.tsx`
- `features/planner/templates/layoutTemplates.ts`
- `features/planner/editor/BlueprintPanel.tsx`
- `features/planner/editor/blueprintImport.ts`
- `features/planner/lib/blueprintPdf.ts` (if exists)
- `features/planner/lib/calibrationScale.ts` (if exists)

---

## Required tests

- Unit: `placeCatalogIntoFabric` dimension conversion (`widthMm / 10` → canvas cm).
- Unit: template shape placement count for every template.
- Unit: calibration `mmPerUnit` formula at several known inputs.
- Integration: save handler calls `exportDraft` once (BUG-04 spy).
- E2E: catalog search → click place → canvas count. Drag-drop place. Drop outside canvas (no placement).
- E2E: template apply to empty canvas → object count. Template apply to existing canvas → confirmation shown.
- E2E: blueprint PNG upload → calibrate → reload → scale preserved.
- Axe: catalog panel open — zero duplicate accessible names.

---

## Exit gate

Catalog, template, and blueprint paths either create correct canonical content or show a recoverable, specific error without corrupting the current plan. BUG-04 resolved. Template confirmation guard implemented. Blueprint export exclusion verified.
