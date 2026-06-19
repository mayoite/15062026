# Oando Planner — Recommended Path (2026-06-19)

**Based on:** Audit Findings + Options Analysis + User Directive ("Finish today; Fabric in; tldraw out; 3D combined")

**Recommended Option:** **Option B — Consolidation with 3D Viewer Swap** (aggressive subset, ~12–16h if parallelized)

---

## Why Option B

1. **The 3D viewer is the most visible user-facing gap.** The new `Planner3DViewer` has WebGL fallback, walk mode, camera memory, and scene metrics — but users currently see the old `PlannerViewer` with no fallback. Swapping this is high-impact, medium-risk.

2. **tldraw residue is a credibility issue.** Comments and imports referencing tldraw in active code confuse the "tldraw is OUT" directive. Stripping them is low-risk, high-clarity.

3. **Bridge unification (Option C) can be deferred.** The Fabric bridge works. The document flows through it correctly. Full unification is architecturally desirable but not user-visible. Schedule it as a follow-up refactoring sprint.

4. **Option A does not honor the user directive.** "Combined with 3D" means the new 3D viewer must be wired. Option A leaves it dead code.

---

## Suggested Execution Order

### Phase 1: CSS & Type Safety (2–3h) — Zero Runtime Risk

1. **Add missing utilities to `app/css/core/typography/type.css`**
   ```css
   @utility typ-caption {
     font-family: var(--font-sans);
     font-size: var(--type-small-size);
     font-weight: var(--font-weight-copy-medium);
     letter-spacing: var(--type-letter-label);
     line-height: var(--type-leading-label);
     color: var(--text-body);
   }
   
   @utility typ-caption-lg {
     font-family: var(--font-sans);
     font-size: var(--type-body-size);
     font-weight: var(--font-weight-copy-regular);
     letter-spacing: var(--type-letter-copy);
     line-height: var(--type-leading-copy-sm);
     color: var(--text-body);
   }
   ```

2. **Add viewer-specific utilities to `app/css/core/planner/planner-overlays.css`**
   ```css
   .planner-workspace .planner-viewer-chip {
     display: inline-flex;
     align-items: center;
     gap: 0.5rem;
     padding: 0.25rem 0.75rem;
     border-radius: var(--radius-pill);
     border: 1px solid var(--border-soft);
     background: var(--surface-glass);
     font-size: var(--pw-text-xs);
     font-weight: 600;
     letter-spacing: var(--pw-letter-ui);
     color: var(--text-body);
     backdrop-filter: blur(8px);
   }
   
   .planner-workspace .planner-viewer-chip-active {
     border-color: var(--color-primary);
     background: color-mix(in srgb, var(--color-primary) 12%, var(--surface-glass));
     color: var(--text-strong);
   }
   
   .planner-workspace .planner-viewer-surface {
     background: var(--surface-glass);
     border: 1px solid var(--border-soft);
     border-radius: var(--radius-lg);
     padding: 0.75rem 1rem;
     font-size: var(--pw-text-xs);
     color: var(--text-body);
     backdrop-filter: blur(12px);
   }
   ```

3. **Fix case-sensitive import paths in tests**
   - `tests/planner-onboarding-onboardingcoach.test.tsx` → import from `../onboarding/OnboardingCoach`
   - `tests/planner-shared-document-documentbridge.test.tsx` → import from `../shared/document/documentBridge`

4. **Run `npm run typecheck` and `npm run lint`** — confirm clean

### Phase 2: 3D Viewer Swap (4–6h) — High User Impact

1. **Adapt `Planner3DViewer` to accept shapes directly**
   - Add a prop converter in `PlannerWorkspace.tsx` that builds a `PlannerDocument` from `fabric3DShapes` and passes it to `Planner3DViewer`
   - Or add a lightweight `shapes` prop to `Planner3DViewer` that builds the scene document internally

2. **Replace `canvas3D` in `PlannerWorkspace.tsx`**
   ```tsx
   // Before
   const canvas3D = (
     <Suspense fallback={<PlannerSkeleton />}>
       <div className="pw-viewer-host h-full min-h-0 w-full">
         <PlannerViewer viewMode="3d" shapes={fabric3DShapes} />
       </div>
     </Suspense>
   );
   
   // After
   const canvas3D = (
     <Suspense fallback={<PlannerSkeleton />}>
       <div className="pw-viewer-host h-full min-h-0 w-full">
         <Planner3DViewer document={fabricShapesToDocument(fabric3DShapes)} />
       </div>
     </Suspense>
   );
   ```

3. **Implement `fabricShapesToDocument` helper** in `features/planner/lib/fabricDocumentBridge.ts`
   - Maps `PlannerViewerShape[]` → `PlannerDocument` with minimal room + items envelope
   - Reuses `buildPlanner3DSceneDocument` from `features/planner/3d/types.ts`

4. **Verify `Planner3DViewer` dark mode**
   - The viewer uses `FOCSS_3D_COLORS` (hardcoded hex) but its overlay HTML uses `text-body`, `surface-inverse`, etc. — these are already tokenized and should adapt via `html.dark` class on the body

5. **Manual QA checklist**
   - [ ] Open `/planner/canvas`
   - [ ] Switch to 3D view
   - [ ] Verify orbit camera rotates with drag
   - [ ] Verify walk mode switches and WASD moves camera
   - [ ] Verify WebGL fallback message shows if canvas is disabled
   - [ ] Verify empty-scene warning appears when no items placed
   - [ ] Verify item labels are readable and styled

### Phase 3: tldraw Residue Cleanup (2–3h) — Low Risk, High Clarity

1. **Remove `tldrawSnapshot` from `PlannerSceneEnvelope`** in `features/planner/lib/documentBridge.ts`
2. **Remove `engine: "tldraw"` from `plannerIdentity.ts`**
3. **Archive `features/planner/hooks/usePlannerWorkspace.ts`** — entire file is tldraw-based; move to `archive/` or delete if `rg` confirms zero callers (note: it is imported by nothing in active workspace code)
4. **Clean comments** in `openingCollision.ts`, `wallOpenings.ts`, `prompts.ts`, `plannerSvgExportColors.ts`
5. **Remove tldraw imports** from `PortalPlanPageView.tsx` (replace with Fabric equivalents or stubs)

### Phase 4: Test Stabilization (2–3h)

1. **Fix `planner-editor-exportActions.test.ts`**
   - Update mock return value to match Fabric document shape `{ roomWidthMm, roomDepthMm, itemCount, sceneJson: { ... } }`

2. **Fix `planner-editor-PlannerLeftPanel.test.tsx`**
   - Update assertion to match current BlueprintPanel content string

3. **Fix `navigation-data.test.ts`**
   - Update `SITE_FOOTER_NAV` assertions to match current nav structure (may require updating `data/site/navigation.ts` or the test expectations)

4. **Run `npm run test:planner`** — confirm all planner tests pass
5. **Run `npm run test`** — confirm full suite passes (or at least matches 903/906 baseline without module errors)

### Phase 5: Defer to Follow-Up Sprint (Post-Consolidation)

- Full bridge unification (Option C scope)
- Persistence barrel (`features/planner/persistence/index.ts`)
- Template picker wiring (`handleApplyTemplate`)
- Blueprint calibration wiring
- Test reorganization into subfolders
- Playwright path migration

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| 3D viewer swap breaks split view | Keep `SplitViewLayout` unchanged; only swap the inner `children3D` component. Test split mode manually. |
| `Planner3DViewer` document prop mismatch | Build a thin adapter in `PlannerWorkspace.tsx` rather than changing `Planner3DViewer` internals. |
| Export actions break after bridge changes | Do not touch `fabricDocumentBridge.ts` core logic in Phase 2. Only add the new `shapes → document` helper. |
| Dark mode looks wrong in 3D | `Planner3DViewer` uses hardcoded hex materials. The overlay UI uses CSS vars. Verify `html.dark` is present on body (it is set by `PlannerBodyTheme`). |
| Test coverage drops | Run `npm run test -- --coverage` before/after. Do not delete tests in this phase. |

---

## Success Criteria for This Session

- [ ] `typ-caption` and `typ-caption-lg` render correctly in 3D viewer overlays
- [ ] `planner-viewer-chip`, `planner-viewer-surface`, `planner-viewer-chip-active` have visual styling
- [ ] 3D view shows the new `Planner3DViewer` with orbit + walk modes
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run test` has 0 module resolution errors (case-sensitive fixes applied)
- [ ] No `tldraw` imports or active references remain in `features/planner/` (comments cleaned)
- [ ] `buildPlannerDocumentFromEditor` is no longer used by production code (exportActions uses `fabricDocumentBridge` directly)

---

## Open Questions for User

1. **Should the old `features/planner/viewer/*` files be deleted or moved to `archive/`?** They contain `InstancedFurnitureRenderer` which has some reusable geometry logic, but the new viewer does not use it.

2. **Should templates be wired in this session, or is the "not yet available" message acceptable?** The `handleApplyTemplate` callback currently shows a toast. Making it functional requires connecting to `floorplanCanvas.ts` preset loading.

3. **Should blueprint calibration be wired in this session?** The `BlueprintPanel` and `CalibrationCapture` components exist but are not integrated into the Fabric canvas scale system.

---

*Recommended by: Oz Agent*
*Date: 2026-06-19*
*Next review: After Phase 2 completion (3D viewer swap)*
