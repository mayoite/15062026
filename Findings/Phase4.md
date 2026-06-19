# Phase 5: tldraw Purge

## Goal

Remove every tldraw import, type, comment, and field from active planner code. The user directive is clear: tldraw is OUT. This phase can run in parallel with Phase 2 (3D Viewer Swap) after Phase 1 is complete.

## Estimated Time

3–4 hours

## Prerequisites

Phase 1 (CSS & Foundation) must be complete. Phase 2 may run in parallel, but coordinate on file deletions (e.g., `viewerMaterials.ts` was moved in Phase 2, not deleted here).

## Tasks

### 5.1 Delete the tldraw-based workspace hook

**File:** `features/planner/hooks/usePlannerWorkspace.ts`

This entire file is tldraw-based. Confirm zero callers:

```bash
grep -rn "from \"@/features/planner/hooks/usePlannerWorkspace\"" features/planner --include="*.ts" --include="*.tsx"
```

If the grep returns nothing, delete the file:

```bash
rm features/planner/hooks/usePlannerWorkspace.ts
```

If it returns something, update the caller to use Fabric equivalents before deleting.

### 5.2 Remove tldraw from `plannerIdentity.ts`

File: `features/planner/model/plannerIdentity.ts`

Find the line with `engine: "tldraw"` and remove it. If it is part of a union type, remove it from the union:

```diff
- export type PlannerEngine = "tldraw" | "fabric";
+ export type PlannerEngine = "fabric";
```

Or remove the `engine` field entirely if it is no longer needed.

### 5.3 Remove tldraw imports from `PortalPlanPageView.tsx`

File: `features/planner/portal/PortalPlanPageView.tsx`

Find any `import ... from "tldraw"` or `@/features/planner/tldraw*` lines. Replace with Fabric equivalents or remove if the feature is not yet implemented. If the portal page needs to render a canvas preview, it should use the Fabric thumbnail export or the 3D viewer snapshot.

### 5.4 Clean tldraw comments across files

For each file in this list, remove or rewrite the comment:

| File | Line(s) | Action |
|------|---------|--------|
| `lib/featureFlags.ts` | 426 | Remove tldraw flag mention |
| `lib/geometry/openingCollision.ts` | 51, 56 | Remove "Fabric-era stub — wall segments no longer come from tldraw shapes" comments |
| `lib/geometry/wallOpenings.ts` | 6, 250 | Remove tldraw references in comments / types |
| `lib/geometry/types.ts` | 1 | Remove "decoupled from tldraw internals" comment or rewrite |
| `ai/prompts.ts` | 87 | Remove tldraw mention in prompt |
| `catalog/placementCatalogDefaults.ts` | 1 | Remove tldraw import comment |
| `store/plannerTypes.ts` | 215 | Remove tldraw type reference |
| `lib/plannerSvgExportColors.ts` | 7, 46 | Remove tldraw color mapping comments |

### 5.5 Remove `tldrawSnapshot` field from remaining types

Search for any remaining `tldrawSnapshot` string:

```bash
grep -rn "tldrawSnapshot" features/planner --include="*.ts" --include="*.tsx" | grep -v "archive/" | grep -v "plans/"
```

Remove the field from every type or object literal where it appears.

### 5.6 Verify zero tldraw references in active code

Run this command and confirm it returns zero results (excluding test files, archive, and this plan directory):

```bash
grep -rni "tldraw" features/planner --include="*.ts" --include="*.tsx" | grep -v "archive/" | grep -v "plans/" | grep -v "tests/" | grep -v "\.test\."
```

If any line is a comment, remove it. If it is an import, replace it. If it is a type field, remove it.

### 5.7 Verify

```bash
npm run typecheck
npm run lint
```

## Verification Checklist

- [ ] `features/planner/hooks/usePlannerWorkspace.ts` deleted (or confirmed still has callers and updated)
- [ ] `plannerIdentity.ts` has no `engine: "tldraw"` (or no `engine` field at all)
- [ ] `PortalPlanPageView.tsx` has no tldraw imports
- [ ] `featureFlags.ts` has no tldraw flag mention
- [ ] `openingCollision.ts` comments cleaned
- [ ] `wallOpenings.ts` comments and types cleaned
- [ ] `geometry/types.ts` comment cleaned
- [ ] `ai/prompts.ts` prompt cleaned
- [ ] `catalog/placementCatalogDefaults.ts` comment cleaned
- [ ] `store/plannerTypes.ts` tldraw type reference removed
- [ ] `lib/plannerSvgExportColors.ts` tldraw comments removed
- [ ] `tldrawSnapshot` field removed from all active types (grep returns 0 in production files)
- [ ] `grep -rni "tldraw" features/planner` (excluding archive/tests/plans) returns 0 results
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

Phase 7 (Test Reorganization) can now delete all tldraw-specific tests without worrying about production code. The codebase is clean for future developers.