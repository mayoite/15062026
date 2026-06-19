# Phase 4: Persistence Cleanup

## Goal

Create one persistence barrel (`features/planner/persistence/index.ts`) and eliminate the duplicate store-layer persistence files. All production code imports persistence through the barrel.

## Estimated Time

4–6 hours

## Prerequisites

Phase 3 (Bridge Unification) must be complete. The document type is now canonical.

## Tasks

### 4.1 Create the persistence barrel

File: `features/planner/persistence/index.ts`

```typescript
/**
 * Persistence barrel — single public API for planner persistence.
 *
 * Import from here, never from the implementation files directly.
 * This lets us swap IndexedDB, localStorage, Supabase, or Drizzle
 * without changing callers.
 */

export {
  savePlannerDraftDocument,
  loadPlannerDraftDocument,
  listPlannerDraftDocuments,
  deletePlannerDraftDocument,
  cleanupExpiredPlannerDrafts,
  type PlannerDraftScope,
  type PlannerDraftEnvelope,
  type PlannerDraftLoadResult,
  type PlannerDraftLoadStatus,
  type PlannerDraftListEntry,
  PLANNER_DRAFT_TTL_MS,
} from "./plannerDraft";

export {
  buildSessionEnvelope,
  parseSessionSnapshot,
  applySessionWorkspace,
  type PlannerSessionEnvelope,
  PLANNER_SESSION_VERSION,
} from "./plannerSession";

export {
  parsePlannerDocumentImportFile,
  type PlannerImportResult,
} from "./plannerImport";

export {
  hydrateCloudPlanIntoIndexedDb,
  type CloudHydrationResult,
} from "./cloudPlanHydration";

export {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  createAutoSaver,
  migrateGuestProjectToMember,
  getPlannerProjectId,
  type PlannerProject,
  type BuddyProject,
  type GuestMigrationResult,
  GUEST_PROJECT_ID,
  MEMBER_PROJECT_ID,
} from "./persistence";
```

Add any missing exports that production code needs. Do not export internal helpers.

### 4.2 Migrate callers to the barrel

Update these files to import from `features/planner/persistence` instead of the deep paths:

**File:** `features/planner/editor/PlannerWorkspace.tsx`

```diff
- import {
-   deletePlannerDraftDocument,
-   listPlannerDraftDocuments,
-   loadPlannerDraftDocument,
-   savePlannerDraftDocument,
-   type PlannerDraftScope,
- } from "@/features/planner/persistence/plannerDraft";
+ import {
+   deletePlannerDraftDocument,
+   listPlannerDraftDocuments,
+   loadPlannerDraftDocument,
+   savePlannerDraftDocument,
+   type PlannerDraftScope,
+ } from "@/features/planner/persistence";
```

Also update `parsePlannerDocumentImportFile` and `hydrateCloudPlanIntoIndexedDb` imports.

**File:** `features/planner/editor/exportActions.ts`

```diff
- import { buildSessionEnvelope } from "@/features/planner/persistence/plannerSession";
+ import { buildSessionEnvelope } from "@/features/planner/persistence";
```

**File:** `features/planner/hooks/usePlannerFabricAutosave.ts`

```diff
- import { createAutoSaver, getPlannerProjectId, loadProject, migrateGuestProjectToMember } from "@/features/planner/persistence/persistence";
- import { applySessionWorkspace, buildSessionEnvelope, parseSessionSnapshot } from "@/features/planner/persistence/plannerSession";
+ import {
+   createAutoSaver,
+   getPlannerProjectId,
+   loadProject,
+   migrateGuestProjectToMember,
+   applySessionWorkspace,
+   buildSessionEnvelope,
+   parseSessionSnapshot,
+ } from "@/features/planner/persistence";
```

**File:** `features/planner/admin/AdminPlansPageView.tsx`

```diff
- import { listPlannerDocumentsFromStore } from "@/features/planner/store/plannerSaves";
+ import { listPlannerDraftDocuments } from "@/features/planner/persistence";
```

(Or whatever the actual admin page needs. Verify the import with `grep`.)

**File:** `features/planner/portal/PortalPlanPageView.tsx`

Update imports similarly.

### 4.3 Convert duplicate store-layer files to thin re-exports

These files in `features/planner/store/` duplicate the persistence layer. Convert each to a re-export:

**File:** `features/planner/store/plannerDraft.ts`

Replace the entire file with:

```typescript
// DEPRECATED: Re-export from persistence barrel.
// This file will be deleted after all callers are migrated.
export * from "../persistence/plannerDraft";
```

**File:** `features/planner/store/plannerSaves.ts`

Replace with:

```typescript
// DEPRECATED: Re-export from persistence barrel.
// This file will be deleted after all callers are migrated.
export * from "../persistence";
```

**File:** `features/planner/store/plannerPersistence.ts`

Replace with:

```typescript
// DEPRECATED: Re-export from persistence barrel.
// This file will be deleted after all callers are migrated.
export * from "../persistence/persistence";
```

**File:** `features/planner/store/plannerProjectStorage.ts`

Replace with:

```typescript
// DEPRECATED: Re-export from persistence barrel.
// This file will be deleted after all callers are migrated.
export * from "../persistence/persistence";
```

**File:** `features/planner/store/offlineStorage.ts`

Check if anything imports it. If it is unused, delete it. If it is used, replace with a re-export or merge its logic into the persistence barrel.

**File:** `features/planner/store/syncQueueProcessor.ts`

Same as above — check imports, delete or re-export.

### 4.4 Verify zero direct imports of old store-layer paths

Run this grep and confirm the output is empty (or only shows the re-export files themselves):

```bash
grep -rn "from \"@/features/planner/store/plannerDraft\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/plannerDraft.ts"
grep -rn "from \"@/features/planner/store/plannerSaves\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/plannerSaves.ts"
grep -rn "from \"@/features/planner/store/plannerPersistence\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/plannerPersistence.ts"
grep -rn "from \"@/features/planner/store/plannerProjectStorage\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/plannerProjectStorage.ts"
grep -rn "from \"@/features/planner/store/offlineStorage\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/offlineStorage.ts"
grep -rn "from \"@/features/planner/store/syncQueueProcessor\"" features/planner --include="*.ts" --include="*.tsx" | grep -v "store/syncQueueProcessor.ts"
```

If any production file imports these paths, update the import to `@/features/planner/persistence`.

### 4.5 Delete the thin re-exports

After confirming zero direct imports, delete the re-export files:

```bash
rm features/planner/store/plannerDraft.ts
rm features/planner/store/plannerSaves.ts
rm features/planner/store/plannerPersistence.ts
rm features/planner/store/plannerProjectStorage.ts
rm features/planner/store/offlineStorage.ts
rm features/planner/store/syncQueueProcessor.ts
```

### 4.6 Verify

```bash
npm run typecheck
npm run lint
```

## Verification Checklist

- [ ] `features/planner/persistence/index.ts` exists and exports all public APIs
- [ ] `PlannerWorkspace.tsx` imports persistence from `@/features/planner/persistence`
- [ ] `exportActions.ts` imports `buildSessionEnvelope` from `@/features/planner/persistence`
- [ ] `usePlannerFabricAutosave.ts` imports persistence from `@/features/planner/persistence`
- [ ] `AdminPlansPageView.tsx` imports persistence from `@/features/planner/persistence`
- [ ] `PortalPlanPageView.tsx` imports persistence from `@/features/planner/persistence`
- [ ] Zero production files import from `@/features/planner/store/plannerDraft` (except the re-export file itself, which is deleted)
- [ ] Same for `store/plannerSaves`, `store/plannerPersistence`, `store/plannerProjectStorage`, `store/offlineStorage`, `store/syncQueueProcessor`
- [ ] Duplicate store-layer files are deleted
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

Phase 6 (Feature Completion) can now add new persistence features (e.g., cloud save) by adding to the barrel without touching every caller. Phase 7 (Tests) has fewer paths to mock.