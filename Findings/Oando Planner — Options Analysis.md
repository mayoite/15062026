# Oando Planner — Options Analysis (2026-06-19)

**Context:** The audit surfaced 2 blockers, 3 high-severity issues, and 3 medium-severity issues. This document presents three distinct resolution strategies with trade-offs.

---

## Option A: Minimal Fix — Patch & Ship

> Fix only the broken things. Do not refactor architecture. Keep both 3D viewers. Leave tldraw comments.

### Actions

| Issue | Fix | Effort |
|---|---|---|
| Missing `typ-caption` / `typ-caption-lg` | Add `@utility typ-caption` and `@utility typ-caption-lg` to `app/css/core/typography/type.css` | 1h |
| Missing `planner-viewer-*` classes | Add to `app/css/core/planner/planner-typography.css` or `app/css/core/planner/planner-overlays.css` | 1h |
| Case-sensitive import failures | Rename test imports to match actual filenames (PascalCase/camelCase) | 30m |
| Test assertion mismatches | Update mocks to match Fabric snapshot shapes | 2h |
| `Planner3DViewer` unused | Leave as-is; do not wire into workspace | 0h |

### Pros
- Fastest path to green tests and stable production
- Minimal risk of regression
- Preserves option to refactor later

### Cons
- Technical debt remains (dual 3D stacks, tldraw residue, bridge fragmentation)
- New 3D viewer (walk mode, WebGL fallback) stays unreachable to users
- Does not satisfy "world-class UI/UX" standard for planner 3D view

### Effort Estimate: **4–6 hours**

---

## Option B: Consolidation — Merge 3D + Clean Surfaces

> Wire the new 3D viewer into the workspace, remove the old one, and strip tldraw residue. Keep document bridges intact to avoid breaking exports.

### Actions

1. **3D Viewer Swap**
   - Replace `PlannerViewer` import in `PlannerWorkspace.tsx` with `Planner3DViewer`
   - Adapt `Planner3DViewer` props to accept `shapes` (convert `PlannerViewerShape[]` to `PlannerDocument` on the fly)
   - Delete `features/planner/viewer/PlannerViewer.tsx`, `FixtureMeshes.tsx`, `InstancedFurnitureRenderer.tsx`, `SceneEnvironment.tsx`, `ShadowConfig.tsx` (or move to archive)

2. **CSS Class Migration**
   - Add `typ-caption` and `typ-caption-lg` to `type.css`
   - Add `planner-viewer-chip`, `planner-viewer-surface`, `planner-viewer-chip-active` to planner shell CSS
   - Update `Planner3DViewer` to use active theme tokens instead of hardcoded `rounded-[2rem]` inline styles where possible

3. **tldraw Residue Cleanup**
   - Remove tldraw import paths from `features/planner/portal/PortalPlanPageView.tsx`
   - Remove `tldrawSnapshot` from `PlannerSceneEnvelope` in `documentBridge.ts`
   - Update `plannerIdentity.ts` to remove `engine: "tldraw"` enum value
   - Delete or archive `features/planner/hooks/usePlannerWorkspace.ts` (entire file is tldraw-based)
   - Clean comments in `openingCollision.ts`, `wallOpenings.ts`, `prompts.ts`

4. **Test Fixes**
   - Fix case-sensitive imports
   - Update `exportActions` test mock to match Fabric document shape
   - Update `PlannerLeftPanel` test to match current Blueprint tab content
   - Update `navigation-data` test to match current `SITE_FOOTER_NAV` structure

5. **Bridge Consolidation (Partial)**
   - Mark `buildPlannerDocumentFromEditor` in `documentBridge.ts` as fully deprecated (remove body, throw)
   - Redirect all callers to `features/planner/lib/fabricDocumentBridge.ts`
   - Keep `PlannerSceneEnvelope` type in one place only

### Pros
- Users get the new 3D viewer (walk mode, WebGL fallback, better lighting)
- Active code is free of legacy tldraw references
- Reduced bundle size from removed 3D viewer stack
- Cleaner mental model for developers

### Cons
- Higher risk of regression in 3D view (requires manual QA of orbit/walk mode, camera memory, scene metrics)
- Export actions may break if bridge consolidation is too aggressive
- Requires updating multiple test mocks and assertions
- 2–3 days of focused work

### Effort Estimate: **16–24 hours**

---

## Option C: Full Reconciliation — Single Document, Single Viewer, Single Bridge

> Complete the architectural vision from the repo-plan checklist: one `PlannerDocument`, one 3D renderer, one persistence barrel, and zero legacy references.

### Actions

All of Option B, plus:

1. **Document Bridge Unification**
   - Merge `features/planner/lib/documentBridge.ts`, `fabricDocumentBridge.ts`, and `document/plannerDocumentBridge.ts` into a single `features/planner/model/plannerDocument.ts` export
   - Remove `shared/document/documentBridge.ts` and `shared/document/types.ts` (archive)
   - Update every consumer (export, persistence, 3D viewer, AI, BOQ) to use the unified document

2. **Persistence Barrel**
   - Create `features/planner/persistence/index.ts` as the single export point
   - Migrate all direct imports from `store/plannerDraft.ts`, `store/plannerSaves.ts`, etc. to the barrel
   - Delete duplicate store-layer persistence files (or convert to re-exports)

3. **Template & Blueprint Completion**
   - Wire `TemplatePickerModal` to actually apply room presets to the Fabric canvas
   - Wire `BlueprintPanel` calibration to set Fabric canvas scale/dpi
   - Finish `handleApplyTemplate` in `PlannerWorkspace.tsx` (currently shows "not yet available" message)

4. **Test Reorganization**
   - Delete all `planner-tldraw-*` test files (173 tests → ~140)
   - Move remaining tests into `tests/planner/` subfolders (unit / integration / e2e)
   - Verify coverage does not drop below current 903/906 baseline

5. **Feature Flags**
   - Remove tldraw feature flags from `featureFlags.ts`
   - Add Fabric-only flags for template/blueprint readiness

### Pros
- Fully realized architecture matching the repo-plan checklist
- No hidden legacy surfaces
- Maintenance cost drops dramatically
- "World-class" UI/UX standard actually met (complete feature set, no dead code)

### Cons
- Largest blast radius; highest regression risk
- Requires touching 20+ files across features, tests, and CSS
- BOQ, export, AI, and portal all need verification after bridge changes
- 3–5 days of focused work
- May introduce new bugs in areas not covered by current tests

### Effort Estimate: **32–48 hours**

---

## Decision Matrix

| Criteria | Option A (Patch) | Option B (Consolidate) | Option C (Full) |
|---|---|---|---|
| Time to green tests | 4–6h | 16–24h | 32–48h |
| Time to user-visible 3D upgrade | Never | 16–24h | 32–48h |
| Architectural debt reduction | Low | Medium | High |
| Regression risk | Low | Medium | High |
| Aligns with repo-plan checklist | No | Partial | Full |
| World-class UI/UX claim | Weak | Strong | Strongest |
| Team cognitive load | High (legacy stays) | Medium | Low |

---

## Recommendation Context

The user directive says: **"Finish the project today. Old tldraw canvas + UI fully replaced by the new fabric canvas/interface... Combined with 3D (r3f)."**

- If "today" is literal: **Option A** is the only feasible choice. Ship the fixes, defer consolidation.
- If "today" means "this session / this sprint": **Option B** is the sweet spot. It delivers the 3D upgrade and removes tldraw residue without the full bridge reconciliation.
- If the goal is a maintainable, architecturally clean codebase: **Option C** is the target, but requires a follow-up sprint.

---

*Prepared by: Oz Agent*
*Date: 2026-06-19*
