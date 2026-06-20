# Phase 4 - Catalog, Templates, and Blueprint

## Goal

Make every content-entry path place correct, recoverable, accurately scaled planner objects.

## Catalog audit

- Purpose filter from setup, categories, search, no-results, recents, favorites, and malformed items.
- Click placement and drag/drop placement at center, edges, zoomed canvas, and invalid drop targets.
- Product image failure, missing 2D block, missing dimensions, duplicate IDs, and unavailable remote catalog.
- Correct category, dimensions, seat count, finish, source ID, and 3D mapping after placement.

## Template audit

- Every template preview, selection, cancellation, application, room size, object count, seat count, bounds, undo, and autosave.
- Applying a template to blank versus nonblank canvases.
- Repeated application and template IDs containing duplicate labels.

## Blueprint audit

- PNG/JPEG/PDF selection, invalid extension, corrupt file, oversized file, multi-page PDF, cancellation, and retry.
- Calibration input, line capture, units, scale calculation, move/opacity/visibility, trace guide, and removal.
- Blueprint persistence, restore, export inclusion rules, and object alignment after reload.

## Task checklist

- [ ] **P4-01 Catalog load:** loading, success, empty and remote/local failure states.
- [ ] **P4-02 Search/filter:** case, SKU, name, material, tags, no result, purpose tabs and subcategories.
- [ ] **P4-03 Card semantics:** one unambiguous primary action per item, keyboard access, tooltip and external product link.
- [ ] **P4-04 Placement:** click, drag, canceled drag, edge drop, zoomed drop, duplicate item and out-of-room behavior.
- [ ] **P4-05 Canonical mapping:** source ID, SKU, dimensions, category, seat count, finish, image and 2D/3D representation.
- [ ] **P4-06 Recents:** order, deduplication, maximum count, reload and missing product handling.
- [ ] **P4-07 Templates:** validate every template preview, bounds, room size, object/seat count, apply, cancel, undo and repeat.
- [ ] **P4-08 Existing-plan policy:** explicitly merge, replace or block template application; never silently destroy content.
- [ ] **P4-09 Blueprint files:** PNG/JPEG/PDF, corrupt, wrong type, oversized, multipage, cancel and retry.
- [ ] **P4-10 Calibration:** valid/invalid reference line, units, scale math, recapture and reset.
- [ ] **P4-11 Underlay controls:** transform, opacity, visibility, trace guide, remove, reload and export rules.
- [ ] **P4-12 Resource cleanup:** revoke object URLs and dispose images, PDF workers and temporary canvases.

## Acceptance artifacts

- Catalog fixture proving canonical placement fields.
- Template manifest report with expected versus actual counts/bounds.
- Blueprint fixture pack with valid and invalid examples.
- Reload screenshot showing unchanged blueprint alignment.

## Work

1. Define user-facing error states for catalog and file-processing failures.
2. Verify all created objects use canonical planner document fields.
3. Prevent template or catalog placement outside usable room bounds unless explicitly allowed.
4. Ensure object URLs, PDF workers, images, and temporary canvases are released.
5. Add fixture files for valid and invalid blueprint cases.

## Primary files

- `features/planner/catalog/`
- `features/planner/editor/templates/TemplatePickerModal.tsx`
- `features/planner/templates/layoutTemplates.ts`
- `features/planner/editor/BlueprintPanel.tsx`
- `features/planner/editor/blueprintImport.ts`
- `features/planner/lib/blueprintPdf.ts`
- `features/planner/lib/calibrationScale.ts`

## Required tests

- Catalog filter/search/placement E2E and canonical-field assertions.
- Template-by-template data tests and one full E2E application test.
- Blueprint integration tests for each format and failure class.
- Reload test proving blueprint scale and transform survive.

## Exit gate

Catalog, template, and blueprint paths either create correct canonical content or show a recoverable, specific error without corrupting the current plan.
