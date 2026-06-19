# Phase 3: Document Bridge Unification

## Goal

Reduce four document bridge implementations to one canonical source. Consolidate `PlannerSceneEnvelope`, `PlannerSceneRoom`, and `PlannerSceneItem` types into the model layer. Make `lib/fabricDocumentBridge.ts` the single builder. Deprecate or archive the other three bridges.

## Estimated Time

6–8 hours

## Prerequisites

Phase 2 (3D Viewer Swap) must be complete. The 3D viewer must consume `PlannerDocument` directly.

## Tasks

### 3.1 Consolidate scene types into the model

File: `features/planner/model/plannerDocument.ts`

Add these Zod schemas and TypeScript types after the existing `plannerSaveWriteSchema` (around line 190):

```typescript
// ── Planner Scene Envelope (unified) ───────────────────────────────────────

export const plannerSceneRoomSchema = z.object({
  widthMm: z.number().int().positive(),
  depthMm: z.number().int().positive(),
  wallHeightMm: z.number().int().positive().default(2400),
  wallThicknessMm: z.number().int().positive().default(120),
  floorThicknessMm: z.number().int().positive().default(40),
  originMm: z.object({
    xMm: z.number().default(0),
    yMm: z.number().default(0),
  }).default({ xMm: 0, yMm: 0 }),
});

export const plannerSceneItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("Furniture"),
  centerMm: z.object({
    xMm: z.number(),
    yMm: z.number(),
  }),
  sizeMm: z.object({
    widthMm: z.number().positive(),
    depthMm: z.number().positive(),
    heightMm: z.number().positive().default(900),
  }),
  rotationDeg: z.number().default(0),
  color: z.string().optional(),
  productId: z.string().optional(),
  productSlug: z.string().optional(),
  plannerSourceSlug: z.string().optional(),
  imageUrl: z.string().optional(),
  dimensions: z.string().optional(),
});

export const plannerSceneMeasurementSchema = z.object({
  canonicalUnit: z.literal("mm").default("mm"),
  displayUnit: z.enum(["mm", "ft-in"]).default("mm"),
  sourceUnit: z.enum(["mm", "cm", "m", "in", "ft"]).optional(),
});

export const plannerSceneEnvelopeSchema = z.object({
  type: z.literal("cad-suite-planner-scene"),
  version: z.literal(1).default(1),
  measurement: plannerSceneMeasurementSchema,
  room: plannerSceneRoomSchema,
  items: z.array(plannerSceneItemSchema).default([]),
  fabricSnapshot: plannerJsonValueSchema.optional(),
});

export type PlannerSceneRoom = z.infer<typeof plannerSceneRoomSchema>;
export type PlannerSceneItem = z.infer<typeof plannerSceneItemSchema>;
export type PlannerSceneEnvelope = z.infer<typeof plannerSceneEnvelopeSchema>;
```

**Why:** Currently these types live in `lib/documentBridge.ts` and are duplicated across `lib/fabricDocumentBridge.ts` and `3d/types.ts`. Putting them in the model with Zod schemas gives runtime validation and a single source of truth.

### 3.2 Remove `tldrawSnapshot` from the envelope

Update `plannerSceneEnvelopeSchema` (above) — it already does not have `tldrawSnapshot`. Good.

Now search for `tldrawSnapshot` in all files and remove it:

```bash
grep -rn "tldrawSnapshot" features/planner --include="*.ts" --include="*.tsx"
```

Expected hits:
- `lib/documentBridge.ts` — line 53, remove the field
- `lib/fabricDocumentBridge.ts` — line 108, remove from the sceneJson object
- Any other file — remove the field

### 3.3 Migrate `getPlannerSceneEnvelope` helper

Move the `getPlannerSceneEnvelope` function from `lib/documentBridge.ts` into `model/plannerDocument.ts` (or into `lib/fabricDocumentBridge.ts` if you prefer). The function is only 12 lines:

```typescript
export function getPlannerSceneEnvelope(sceneJson: PlannerJsonValue): PlannerSceneEnvelope | null {
  if (!sceneJson || typeof sceneJson !== "object" || Array.isArray(sceneJson)) return null;
  const obj = sceneJson as Record<string, unknown>;
  if (obj.type === "cad-suite-planner-scene" && obj.version === 1) {
    const parsed = plannerSceneEnvelopeSchema.safeParse(obj);
    return parsed.success ? parsed.data : null;
  }
  if (obj.plannerScene && typeof obj.plannerScene === "object") {
    const parsed = plannerSceneEnvelopeSchema.safeParse(obj.plannerScene);
    return parsed.success ? parsed.data : null;
  }
  return null;
}
```

**Why:** This is the only runtime logic from `lib/documentBridge.ts` that is still needed. Everything else in that file is deprecated.

### 3.4 Deprecate `lib/documentBridge.ts`

Replace the entire file with a thin re-export:

```typescript
// features/planner/lib/documentBridge.ts
// DEPRECATED: All types moved to model/plannerDocument.ts.
// All builders moved to lib/fabricDocumentBridge.ts.
// This file exists only to prevent import breakage during migration.
// TODO: Remove after all callers are updated.

export type {
  PlannerSceneRoom,
  PlannerSceneItem,
  PlannerSceneEnvelope,
} from "../model/plannerDocument";

export {
  getPlannerSceneEnvelope,
} from "../model/plannerDocument";
```

Add a lint suppression or a build warning if needed, but the goal is to delete this file entirely after Phase 4.

### 3.5 Redirect `document/plannerDocumentBridge.ts`

File: `features/planner/document/plannerDocumentBridge.ts`

This file currently duplicates `buildPlannerDocumentFromFabric` and adds workspace metadata merging. Simplify it to a thin wrapper:

```typescript
import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
import type { PlannerDocument } from "@/features/planner/model/plannerDocument";

/**
 * Build a canonical PlannerDocument from the Fabric canvas + workspace state.
 * This is a thin wrapper around buildPlannerDocumentFromFabric that merges
 * workspace metadata. Prefer importing from lib/fabricDocumentBridge directly.
 * @deprecated Use buildPlannerDocumentFromFabric with explicit metadata.
 */
export function buildPlannerDocumentFromEditor(
  _editor: null,
  overrides: Partial<PlannerDocument> = {},
): PlannerDocument {
  // ...existing logic stays for now, but add a console.warn in dev:
  if (process.env.NODE_ENV === "development") {
    console.warn("buildPlannerDocumentFromEditor is deprecated. Use buildPlannerDocumentFromFabric.");
  }
  // ... keep existing implementation ...
}
```

Then update `exportActions.ts` to import from `lib/fabricDocumentBridge.ts` directly instead of `document/plannerDocumentBridge.ts`:

```diff
- import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
+ import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
```

And update `downloadPlannerJson` to call `buildPlannerDocumentFromFabric(null, { ... })` instead of `buildPlannerDocumentFromEditor(null)`.

### 3.6 Archive `shared/document/documentBridge.ts` and `shared/document/types.ts`

These files are only imported by tests. Move them to `archive/`:

```bash
mv features/planner/shared/document/documentBridge.ts archive/
mv features/planner/shared/document/types.ts archive/
```

Update any test imports to point to the canonical locations (e.g., `model/plannerDocument.ts` or `lib/fabricDocumentBridge.ts`). If the tests were already broken (case-sensitive), they are fixed in Phase 1.

### 3.7 Update 3D types to use unified model

File: `features/planner/3d/types.ts`

This file currently defines its own `Planner3DRoom`, `Planner3DItem`, `Planner3DSceneDocument`. These should be replaced with imports from the model, or at least made compatible:

```diff
- export interface Planner3DRoom { ... }
- export interface Planner3DItem { ... }
- export interface Planner3DSceneDocument { ... }
+ import type { PlannerSceneRoom, PlannerSceneItem, PlannerSceneEnvelope } from "../model/plannerDocument";
+ export type Planner3DRoom = PlannerSceneRoom;
+ export type Planner3DItem = PlannerSceneItem;
+ export type Planner3DSceneDocument = PlannerSceneEnvelope & { id: string; title: string; note?: string };
```

This ensures the 3D viewer and the document builder speak the same language.

### 3.8 Verify all consumers compile

Update these files if they still import from `lib/documentBridge.ts` for types:
- `lib/fabricDocumentBridge.ts` — import `PlannerSceneEnvelope`, `PlannerSceneItem`, `PlannerSceneRoom` from `model/plannerDocument`
- `persistence/plannerDraft.ts` — import from `model/plannerDocument`
- `editor/exportActions.ts` — import from `model/plannerDocument` or `lib/fabricDocumentBridge`
- `ai/applySuggestedLayout.ts` — import from `model/plannerDocument`
- `portal/PortalPlanPageView.tsx` — import from `model/plannerDocument`

Then run:

```bash
npm run typecheck
npm run lint
```

## Verification Checklist

- [ ] `plannerSceneEnvelopeSchema`, `plannerSceneRoomSchema`, `plannerSceneItemSchema` exist in `model/plannerDocument.ts`
- [ ] `tldrawSnapshot` field removed from all active type definitions (grep returns 0 hits in `features/planner/*.ts`)
- [ ] `getPlannerSceneEnvelope` function exists in `model/plannerDocument.ts` and uses Zod `safeParse`
- [ ] `lib/documentBridge.ts` is a thin re-export (no builder logic, no tldraw fields)
- [ ] `document/plannerDocumentBridge.ts` has `@deprecated` marker and `console.warn`
- [ ] `exportActions.ts` imports `buildPlannerDocumentFromFabric` instead of `buildPlannerDocumentFromEditor`
- [ ] `features/planner/shared/document/documentBridge.ts` moved to `archive/`
- [ ] `features/planner/shared/document/types.ts` moved to `archive/`
- [ ] `3d/types.ts` imports or aliases from `model/plannerDocument`
- [ ] All production files that used `PlannerSceneEnvelope` now import from `model/plannerDocument`
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0

## What This Unblocks

Phase 4 (Persistence Cleanup) can now assume a single document type flows through the entire system. Phase 6 (Feature Completion) can use the unified document for AI placement and template loading.