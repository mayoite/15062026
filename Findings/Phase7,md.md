# Phase 7: Test Reorganization

## Goal

Fix the remaining test failures, delete all tldraw-specific tests, move the remaining tests into logical subfolders, and verify coverage does not drop below the baseline.

## Estimated Time

4–6 hours

## Prerequisites

All implementation phases (1–6) must be complete. The code is stable and features are wired.

## Tasks

### 7.1 Fix existing test failures

These are the known failures from the audit baseline:

**A. `navigation-data.test.ts`**

Run the test to see the exact failure:

```bash
npx vitest run tests/navigation-data.test.ts
```

The test expects specific `SITE_FOOTER_NAV` link labels. If the navigation data has changed, either:
- Update the test expectations to match the current `data/site/navigation.ts` structure, OR
- Update `data/site/navigation.ts` to match the test expectations

Prefer updating the test if the navigation change was intentional.

**B. `planner-editor-exportActions.test.ts`**

The mock for `buildPlannerDocumentFromEditor` returns `{ version: 1, shapes: [] }` but `buildExportMeta` expects furniture dimensions from the Fabric snapshot. Since Phase 3 redirects `exportActions.ts` to `buildPlannerDocumentFromFabric`, update the mock:

```diff
- vi.mock("@/features/planner/document/plannerDocumentBridge", () => ({
-   buildPlannerDocumentFromEditor: vi.fn(() => ({ version: 1, shapes: [] })),
- }));
+ vi.mock("@/features/planner/lib/fabricDocumentBridge", () => ({
+   buildPlannerDocumentFromFabric: vi.fn(() => ({
+     id: "test-id",
+     name: "Test Plan",
+     roomWidthMm: 5000,
+     roomDepthMm: 4000,
+     itemCount: 1,
+     sceneJson: {
+       type: "cad-suite-planner-scene",
+       version: 1,
+       measurement: { canonicalUnit: "mm", displayUnit: "mm" },
+       room: { widthMm: 5000, depthMm: 4000, wallHeightMm: 2400, wallThicknessMm: 120, floorThicknessMm: 40, originMm: { xMm: 0, yMm: 0 } },
+       items: [{ id: "item-1", name: "Desk", category: "Furniture", centerMm: { xMm: 1000, yMm: 1000 }, sizeMm: { widthMm: 1200, depthMm: 600, heightMm: 900 }, rotationDeg: 0 }],
+     },
+   })),
+ }));
```

**C. `planner-editor-PlannerLeftPanel.test.tsx`**

The test expects specific Blueprint tab content. Run the test to see the exact failure, then update the assertion to match the current `BlueprintPanel` content.

### 7.2 Delete tldraw-specific tests

These are the files listed in `tests/INVENTORY.md` with the `planner-tldraw-*` prefix. Delete them:

```bash
rm tests/planner-tldraw-DoorWindowShape.test.ts
rm tests/planner-tldraw-MeasurementShape.test.ts
rm tests/planner-tldraw-WallShape.test.ts
rm tests/planner-tldraw-catalogBlockBridge-extra.test.ts
rm tests/planner-tldraw-exports.test.ts
rm tests/planner-tldraw-furnitureBlocks2d.test.ts
rm tests/planner-tldraw-plannerTldrawEditorBridge.test.ts
rm tests/planner-tldraw-plannerTldrawRegistration.test.ts
rm tests/planner-tldraw-rectDrag.test.ts
rm tests/planner-tldraw-renderBlockPrims.test.tsx
rm tests/planner-tldraw-shapeUtils-branches.test.tsx
rm tests/planner-tldraw-shapeUtils-labelEdit.test.tsx
rm tests/planner-tldraw-shapeUtils.test.tsx
rm tests/planner-tldraw-shapeValidation.test.ts
rm tests/planner-tldraw-shapes-defaults.test.ts
rm tests/planner-tldraw-sideEffects.test.ts
rm tests/planner-tldraw-tldrawShapeRegistry.test.ts
rm tests/planner-tldraw-tldrawSnap.test.ts
rm tests/planner-tldraw-tools-ClearanceChecker.test.ts
rm tests/planner-tldraw-tools-DoorWindowPlacement.test.ts
rm tests/planner-tldraw-tools-FurniturePlacement.test.ts
rm tests/planner-tldraw-tools-Measurement.test.ts
rm tests/planner-tldraw-tools-RoomDetection.test.ts
rm tests/planner-tldraw-tools-ShapeRegistrationSystem.test.ts
rm tests/planner-tldraw-tools-StateNodes.test.ts
rm tests/planner-tldraw-tools-WallTool.test.ts
rm tests/planner-tldraw-tools-ZoneOverlay.test.ts
rm tests/planner-tldraw-tools-branches.test.ts
rm tests/planner-tldraw-tools-index.test.ts
```

If any of these files do not exist, skip them. If there are additional tldraw tests not in this list, delete them too. Use `find` to be safe:

```bash
find tests -name "*tldraw*" -type f -delete
```

### 7.3 Create test subfolder structure

```bash
mkdir -p tests/planner/unit
mkdir -p tests/planner/integration
mkdir -p tests/planner/e2e
```

Move the remaining planner tests into the appropriate folder:

**Unit tests** (pure logic, no React components):
- `planner-3d-types.test.ts`
- `planner-lib-*.test.ts` (measurements, geometry, documentBridge, etc.)
- `planner-model-*.test.ts`
- `planner-catalog-*.test.ts`
- `planner-persistence-*.test.ts`
- `planner-shared-*.test.ts`

**Integration tests** (React components, hooks):
- `planner-editor-*.test.tsx`
- `planner-ui-*.test.tsx`
- `planner-hooks-*.test.tsx`
- `planner-3d-Viewer.test.tsx`
- `planner-onboarding-*.test.tsx`

**E2E tests** (Playwright specs):
- Any `*.spec.ts` files already in `tests/`
- Move them to `tests/planner/e2e/`

Do this with `mv` commands. For example:

```bash
mv tests/planner-3d-types.test.ts tests/planner/unit/
mv tests/planner-lib-*.test.ts tests/planner/unit/
# ... etc
```

### 7.4 Update Vitest config

File: `vitest.config.ts` (or `config/build/vitest.config.ts`)

Add the new test paths to the `include` array:

```diff
  include: [
    "tests/**/*.{test,spec}.{ts,tsx}",
+   "tests/planner/unit/**/*.{test,spec}.{ts,tsx}",
+   "tests/planner/integration/**/*.{test,spec}.{ts,tsx}",
+   "tests/planner/e2e/**/*.{test,spec}.{ts,tsx}",
  ],
```

If `tests/**/*` already covers subfolders, this may not be necessary. But check if the config has any `exclude` patterns that would block the new paths.

### 7.5 Verify coverage

Run the full test suite:

```bash
npm run test
```

Confirm:
- 0 module resolution errors
- 0 failed tests
- No worker crashes

Then run coverage:

```bash
npm run test -- --coverage
```

Check the coverage report. Target:
- **Lines:** ≥ 85% of current baseline (or whatever the current number is — record it in `11-Handover.md`)
- **Functions:** ≥ 80%
- **Branches:** ≥ 75%

If coverage dropped because of deleted tldraw tests, add focused tests for the new Fabric bridges:
- Template application
- Blueprint calibration
- 3D viewer rendering (if not already covered)
- AI suggestion placement

Do not add tests just to inflate coverage — add tests that verify real behavior.

### 7.6 Update Playwright paths (if needed)

File: `playwright.config.ts`

If Playwright tests were moved to `tests/planner/e2e/`, update the `testDir` or `testMatch` pattern:

```diff
- testMatch: "tests/**/*.spec.ts",
+ testMatch: "tests/planner/e2e/**/*.spec.ts",
```

Or add multiple patterns if there are non-planner E2E tests too.

### 7.7 Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test -- --coverage
```

## Verification Checklist

- [ ] `navigation-data.test.ts` passes
- [ ] `planner-editor-exportActions.test.ts` passes (mock updated for Fabric document shape)
- [ ] `planner-editor-PlannerLeftPanel.test.tsx` passes (assertion matches current BlueprintPanel)
- [ ] All `planner-tldraw-*` test files deleted
- [ ] `find tests -name "*tldraw*"` returns 0 results
- [ ] `tests/planner/unit/` exists and contains logic tests
- [ ] `tests/planner/integration/` exists and contains component tests
- [ ] `tests/planner/e2e/` exists and contains Playwright specs
- [ ] Vitest config includes the new subfolder paths (or `tests/**/*` already covers them)
- [ ] `npm run test` passes with 0 module errors and 0 failed tests
- [ ] Coverage report generated and meets baseline targets
- [ ] Playwright config updated if tests moved

## What This Unblocks

Phase 8 (Final Validation) can now run the full gate with confidence. The test suite is clean, organized, and coverage is verified.