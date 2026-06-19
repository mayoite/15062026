# M1-M7 Planner Recovery Plan

Date: 2026-06-19
Repo: `E:\16062026`
References: `E:\Goodsites\15062026`, `E:\floorplan-react`, `E:\16062026\archive`

## Executive read

The Fabric replacement is real and already wired into the active planner shell, but the current workspace is only partially equivalent to the old planner contract. The biggest gaps are not route-level app breakage. They are contract gaps inside the planner itself: selection, inspector edits, layers, metrics, document fidelity, export confidence, and event-driven 2D→3D/session sync.

Admin, member portal, dashboard, and auth surfaces are largely unchanged by the Fabric migration. Their current risk is indirect: planner save identity, document shape, and future plan-detail integrations.

## What is proven already

### Active replacement facts

- `features/planner/editor/PlannerWorkspace.tsx` now mounts `FloorplanProvider` and `FabricCanvasWorkspace`, and drives 3D from Fabric state.
- `features/planner/lib/fabricDocumentBridge.ts` builds planner documents from Fabric, but falls back to a default room (`5000 x 4000`) and depends on `fabricSnapshot` for round-trip reload.
- `features/planner/document/plannerDocumentBridge.ts` is now Fabric-based, but room dimensions still derive from broad metrics and a simplified snapshot payload.
- `features/planner/hooks/usePlannerFabricAutosave.ts` uses local autosave infrastructure, but the old event-rich editor/store contract has been reduced to serialized snapshot persistence.

### Quality regressions with file proof

- `features/planner/editor/shapeInspectorBridge.ts` is read-mostly; apply/delete/duplicate actions are stubs.
- `features/planner/editor/LayerManagerPanel.tsx` is a simplified object list, not the earlier interactive layer manager.
- `features/planner/editor/planMetrics.ts` computes approximate Fabric metrics, but far less richly than the prior planner model.
- `features/planner/lib/applyRoomPreset.ts` inserts a generic room object instead of applying a true room preset workflow.
- `features/planner/store/floorTemplates.ts` contains mojibake icon strings like `≡ƒôä`, `Γ¼£`, `≡ƒÅó`.
- `features/planner/catalog/catalogTypes.ts` still exposes emoji category icons.
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx` still uses literal arrow glyphs for arrange controls.

### Cross-surface stability facts

- The earlier comparison against `E:\Goodsites\15062026` showed admin, member portal, dashboard, and auth code are mostly unchanged outside planner route wiring.
- Main indirect risk zones are planner persistence identity, local draft/session format, and future plan-detail integrations.

## M1-M7 sequence

## M1 - Canvas Contract Recovery

Goal: restore the planner contract around the Fabric engine so the workspace behaves like one system again.

Primary files:

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/canvas-fabric/*`
- `features/planner/document/plannerDocumentBridge.ts`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/hooks/usePlannerFabricAutosave.ts`

Deliver:

- Replace ad-hoc bridge behavior with one explicit Fabric runtime contract.
- Remove polling/global-style drift where possible and move to event-driven state publication.
- Make 2D, 3D, autosave, export, and inspector consume the same canonical Fabric document/session shape.

Proof sources to borrow from:

- `E:\Goodsites\15062026\features\planner\shared\engine\SharedTldrawEngine.tsx`
- `E:\Goodsites\15062026\features\planner\document\plannerDocumentBridge.ts`
- `E:\Goodsites\15062026\features\planner\hooks\usePlannerAutosave.ts`

Do not revive:

- tldraw rendering itself
- tldraw-specific shape APIs
- deleted canvas boot loaders and guards

## M2 - Canvas UX Parity

Goal: recover day-to-day usability inside the new Fabric workspace.

Primary files:

- `features/planner/editor/shapeInspectorBridge.ts`
- `features/planner/editor/inspector/PropertiesInspector.tsx`
- `features/planner/editor/LayerManagerPanel.tsx`
- `features/planner/editor/editorSelectionStatus.ts`
- `features/planner/editor/PlannerStatusBar.tsx`
- `features/planner/editor/planMetrics.ts`
- `features/planner/lib/applyRoomPreset.ts`

Deliver:

- Inspector edits that actually write back to Fabric selection.
- Layer manager with select, fit, lock, order, and grouping parity.
- Better metrics from Fabric objects and calibrated blueprint data.
- Real room preset application instead of generic insertion.
- Clear selection/status text and review-step confidence.

Proof sources to borrow from:

- `E:\Goodsites\15062026\features\planner\editor\shapeInspectorBridge.ts`
- `E:\Goodsites\15062026\features\planner\editor\LayerManagerPanel.tsx`
- `E:\Goodsites\15062026\features\planner\editor\planMetrics.ts`
- `E:\Goodsites\15062026\features\planner\editor\layerVisibility.ts`

## M3 - Admin + Ops + Database Readiness

Goal: keep admin and ops safe while planner internals change.

Current diagnosis:

- Planner migration did not materially rewrite admin route trees.
- The real concern is document compatibility, not admin page rendering.

Primary review surfaces:

- `app/admin/**`
- `features/planner/admin/**`
- `features/ops/**`
- planner persistence and document builders only where they feed admin data

Deliver:

- Confirm which admin/ops views read planner draft/document fields directly.
- Freeze a stable planner document envelope before wiring richer admin plan detail.
- Document database-sensitive boundaries and keep schema/auth untouched unless explicitly approved.

Risk note:

- Per repo rules, no migration/schema/auth changes should happen without explicit approval.

## M4 - SVG / Export / Document Fidelity

Goal: make export and saved plan data trustworthy again.

Primary files:

- `features/planner/editor/exportActions.ts`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/document/plannerDocumentBridge.ts`
- export UI and PDF helpers under `features/planner/shared/export/*`

Deliver:

- Ensure SVG/PNG export reflect the actual room and placed content, not fallback dimensions.
- Improve planner document fidelity so load/export/reload are stable without hidden assumptions.
- Keep JSON export as the canonical debugging artifact during parity work.

Proof sources to borrow from:

- `E:\Goodsites\15062026\features\planner\editor\exportActions.ts`
- `E:\Goodsites\15062026\features\planner\shared\document\documentBridge.ts`
- `E:\Goodsites\15062026\features\planner\lib\documentBridge.ts`

## M5 - Member + Dashboard Integration

Goal: preserve the member journey while the planner internals stabilize.

Current diagnosis:

- Member portal and dashboard surfaces are not the source of the current breakage.
- Their risk is future planner session loading and draft identity.

Primary surfaces:

- `app/(site)/portal/**`
- `features/planner/portal/**`
- `app/(site)/dashboard/**`
- `features/shared/dashboard/**`
- planner persistence keys and session metadata

Deliver:

- Verify member-linked plan loading paths still map to the correct local/member identity.
- Confirm dashboard summaries keep reading the same project index safely.
- Define one stable handoff shape for portal/admin plan cards and detail pages.

## M6 - Landing + Surface Quality

Goal: stop the planner suite from feeling stitched together after the migration.

Primary surfaces:

- `features/planner/landing/**`
- planner shell chrome around `app/planner/**`
- top/sub bars and workspace status surfaces

Deliver:

- Align planner landing language with the actual Fabric + 3D product.
- Remove stale tldraw-era framing from copy, screenshots, and workflow hints.
- Normalize icon language and reduce low-quality symbol usage across visible planner surfaces.

## M7 - Package / Icon / Upgrade Pass

Goal: clean the technical and visual edges that are making the repo feel unstable.

### Package view

Likely safe near-term focus:

- Normalize packages around the active stack, not the retired one.
- Audit whether retired tldraw packages are still needed anywhere in active code.
- Review low-signal dependencies such as `audit` and `fix`, which look suspicious and may not belong in production dependencies.

Observed drift worth reviewing:

- `lucide-react` is newer here than in `15062026`, but icon usage quality is inconsistent.
- Fabric stack already matches the prototype direction: `fabric ^7.4.0`, `motion ^12.40.0`, `vaul ^1.1.2`.
- This repo carries more product/runtime surface than `E:\floorplan-react`, so direct version mirroring is not appropriate.

### Icon quality view

Immediate fixes bucket:

- Replace mojibake icons in `features/planner/store/floorTemplates.ts`.
- Replace emoji category icons in `features/planner/catalog/catalogTypes.ts`.
- Replace literal arrange arrows in `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx`.
- Reduce mixed icon language between `lucide-react` and `@phosphor-icons/react` where the same surface can be standardized.

Normalization target:

- One primary icon system for product UI.
- Purposeful exceptions only where branding/marketing truly benefits.
- No raw emoji or corrupted symbols in active planner product surfaces.

## Recommended execution order

1. M1 Canvas Contract Recovery
2. M2 Canvas UX Parity
3. M4 SVG / Export / Document Fidelity
4. M5 Member + Dashboard Integration
5. M3 Admin + Ops + Database Readiness
6. M6 Landing + Surface Quality
7. M7 Package / Icon / Upgrade Pass

## Why this order

- M1 and M2 unblock the real planner core.
- M4 must happen before downstream confidence work because export/save fidelity defines what the rest of the app can trust.
- M5 and M3 depend more on stable planner identity/document shape than on visual polish.
- M6 and M7 should clean the product once the planner core stops moving under them.

## Agent monitoring notes

Already completed earlier:

- Planner/editor/canvas/SVG comparison: strong signal gathered
- Admin/member/landing/dashboard comparison: strong signal gathered
- `E:\floorplan-react` migration comparison: strong signal gathered

Retried this round and kept open per instruction:

- package audit worker
- icon audit worker
- archive recovery-pattern worker

This round hit transport failures while contacting the model service, not repo-local failures. The workers were not dismissed.

## Shipping definition for this repo

Done means:

- planner canvas is Fabric-first and contract-complete
- 2D, 3D, save/load, export, and review panels agree on the same document
- admin/member/dashboard can safely consume planner sessions without hidden format drift
- active planner surfaces no longer ship corrupted or placeholder iconography
