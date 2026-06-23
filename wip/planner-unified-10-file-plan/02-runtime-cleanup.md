# Runtime Cleanup

## Objective

Remove retained planner runtime work so repeated mount/unmount, 2D/3D switching, and session changes do not leak handlers, stale async work, or renderer state.

## Files

- `E:\16062026\features\planner\canvas-fabric\plannerRuntime.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- `E:\16062026\features\planner\canvas-fabric\context\FloorplanContext.tsx`
- `E:\16062026\features\planner\3d\Planner3DViewer.tsx`
- `E:\16062026\features\planner\hooks\usePlannerFabricAutosave.ts`
- `E:\16062026\features\planner\hooks\useAssetLoader.ts`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- `E:\16062026\features\planner\editor\usePlannerPanels.ts`
- `E:\16062026\features\planner\catalog\usePlannerCatalogHydration.ts`

## Required Outcomes

- repeated mount/unmount does not retain stale listeners or timers
- 2D/3D switching does not leak renderer, controls, pointer lock, or global handlers
- stale async completion cannot write into a newer mount
- cleanup is generation-safe and idempotent

## Implementation Steps

1. Inventory listeners, timers, RAFs, observers, subscriptions, async callbacks, and renderer resources.
2. Name the owner for each resource and the exact cleanup path.
3. Make cleanup generation-safe so stale teardown cannot damage a newer mount.
4. Cancel or ignore async completion after unmount, route change, or session switch.
5. Recheck autosave, hydration, and panel subscriptions for stale writes.

## Truth / Evidence

- existing runtime seam: `E:\16062026\features\planner\canvas-fabric\plannerRuntime.ts`
- existing shell seam: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- teardown-sensitive hooks: `usePlannerFabricAutosave.ts`, `useAssetLoader.ts`, `usePlannerSessionHandlers.ts`

## Do Not Break

- current planner shell boot
- fresh remount after cleanup
- autosave/session behavior for active mounts

## Proof Target

Proof for this file is strong only if a reviewer can show:
- where stale cleanup is blocked
- where async results are canceled or ignored
- why remounting does not retain previous ownership

## Completion Checklist

- [x] Every retained runtime resource has an owner and cleanup path.
- [ ] Cleanup is safe against strict-mode remount or rapid mode switch. <!-- partial: source cleanup added, runtime remount proof is still missing -->
- [ ] Async completion after unmount cannot mutate active state. <!-- partial: stale-owner guards added, runtime proof is still missing -->
- [x] Verification exists or the exact gap is logged.
