# Memory Management and Leaks Audit Report

**Audit Path:** `21062026/05-memory-management-leaks.md`  
**Date:** June 21, 2026  
**Auditor:** Agent 2 (Performance & Resource Specialist)  

---

## Executive Scorecard

| Parameter | Description | Score (1-10) | Status |
|---|---|---|---|
| **21** | Event listener disposal in Three.js / R3F components | 8.5/10 | Very Good |
| **22** | Event listener disposal in Fabric.js 2D Canvas modules | 10.0/10 | Perfect |
| **23** | WebGL context disposal & memory releasing on route exit | 8.0/10 | Very Good |
| **24** | Canvas resize handlers optimization | 9.0/10 | Excellent |
| **25** | Garbage collection patterns & closure memory leak avoidance | 8.5/10 | Very Good |

**Overall Memory Management Score:** **8.8 / 10**

---

## Detailed Audit Findings & Recommendations

### Parameter 21: Event Listener Disposal in Three.js / R3F Components
**Score:** 8.5 / 10

#### Findings
1. **Walk Camera Listeners:** Keyboard, mouse, pointer lock, and click event listeners are registered inside the R3F walk camera controllers. These listeners are correctly bound and cleanly removed within the unmount return callback of their respective hooks (see [Planner3DViewer.tsx](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx#L386-L419)).
2. **Animation Loop Hooks:** R3F handles the animation render loop (`useFrame`) internally, ensuring frame requests are automatically canceled when components unmount.

#### Citations
- Camera controls listener cleanup: [Planner3DViewer.tsx](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx#L386-L419)

#### Recommendations
- Standardize the event listener registration pattern by encapsulating custom canvas/window hooks under dedicated cleanup helpers or React hooks that automatically enforce teardowns.

---

### Parameter 22: Event Listener Disposal in Fabric.js 2D Canvas Modules
**Score:** 10.0 / 10

#### Findings
The Fabric.js 2D Canvas integration exhibits exceptional garbage collection and memory leak discipline:
1. **DOM Event Listeners:** Keydown, keyup, resize, and orientation changes registered in the DOM are completely unbound on unmount (see [FloorplanCanvas.tsx](file:///e:/16062026/features/planner/canvas-fabric/FloorplanCanvas.tsx#L90-L99)).
2. **Observer Cleanup:** The `ResizeObserver` monitoring the canvas wrapping container is cleanly disconnected via `.disconnect()` (see [FloorplanCanvas.tsx](file:///e:/16062026/features/planner/canvas-fabric/FloorplanCanvas.tsx#L96)).
3. **Canvas API Disconnect:** Fabric canvas instances are destroyed by executing `.dispose()` on the Fabric canvas view within the api controller cleanup lifecycle. This tears down internal render loops and removes listener maps registered directly on the canvas element (see [floorplanCanvas.ts](file:///e:/16062026/features/planner/canvas-fabric/hooks/floorplanCanvas.ts#L1088-L1094)).

#### Citations
- React-level canvas observer/listener teardowns: [FloorplanCanvas.tsx](file:///e:/16062026/features/planner/canvas-fabric/FloorplanCanvas.tsx#L90-L99)
- Fabric-level Canvas API disposal implementation: [floorplanCanvas.ts](file:///e:/16062026/features/planner/canvas-fabric/hooks/floorplanCanvas.ts#L1088-L1094)

#### Recommendations
- Continue enforcing this perfect cleanup pattern. Maintain automated unit tests verifying that mounting and unmounting the editor canvas restores the global window event listener count to its pre-mount baseline.

---

### Parameter 23: WebGL Context Disposal & Memory Releasing on Route Exit
**Score:** 8.0 / 10

#### Findings
WebGL context leaks can rapidly trigger browser tab crashes due to hardware memory limits:
1. **Renderer Disposal:** In [Planner3DViewer.tsx](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx#L254), the WebGL renderer instance is successfully captured via `onCreated` and cached inside a ref (`rendererRef.current`). During the component unmount hook, `rendererRef.current?.dispose()` is called to free up textures and geometries from GPU memory.
2. **Context Loss Omission:** Simply calling `.dispose()` on a Three.js renderer does not release the physical WebGL context immediately. It depends on browser garbage collection cycles. To guarantee immediate hardware context release, the `WEBGL_lose_context` extension should be explicitly called.
3. **Product Page Omission:** The product detail page viewer ([ThreeViewer.tsx](file:///e:/16062026/components/ThreeViewer.tsx)) lacks custom renderer cleanup hooks when the viewer toggles off or unmounts.

#### Citations
- Renderer capture & dispose hook: [Planner3DViewer.tsx](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx#L254)
- PDP 3D viewer mount configuration: [ThreeViewer.tsx](file:///e:/16062026/components/ThreeViewer.tsx)

#### Recommendations
- In both [Planner3DViewer.tsx](file:///e:/16062026/features/planner/3d/Planner3DViewer.tsx) and [ThreeViewer.tsx](file:///e:/16062026/components/ThreeViewer.tsx), update the unmount hooks to force-lose the WebGL context:
  ```typescript
  const gl = rendererRef.current;
  if (gl) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    gl.dispose();
  }
  ```

---

### Parameter 24: Canvas Resize Handlers Optimization
**Score:** 9.0 / 10

#### Findings
1. **Throttled Fit Recalculations:** The canvas fit operations (`applyFit()`) are invoked inside animation frames (`requestAnimationFrame`). When the browser triggers consecutive window resize notifications, the calculations are throttled to prevent layout thrashing and high CPU utilization.
2. **Proper Frame Cancellation:** Pending animation frame request IDs (`fitFrame`) are preserved and cancelled via `cancelAnimationFrame(fitFrame)` on teardown, preventing handlers from executing on unmounted components.

#### Citations
- Throttled window resize handler: [FloorplanCanvas.tsx](file:///e:/16062026/features/planner/canvas-fabric/FloorplanCanvas.tsx#L66-L88)
- Animation frame cleanup hook: [FloorplanCanvas.tsx](file:///e:/16062026/features/planner/canvas-fabric/FloorplanCanvas.tsx#L91)

#### Recommendations
- Wrap the main window `resize` and `orientationchange` listener bindings in a light utility debouncer (e.g. 50-100ms) to reduce execution load on lower-end mobile devices during rapid rotation changes.

---

### Parameter 25: Garbage Collection Patterns & Closure Memory Leak Avoidance
**Score:** 8.5 / 10

#### Findings
1. **Strict Mode Gen Bridge:** In React Strict Mode, double-mount setups can trigger race conditions where the first mount's cleanup hook wipes out the second mount's active variables. The project implements a generation counter (`runtimeGeneration`) in [plannerRuntime.ts](file:///e:/16062026/features/planner/canvas-fabric/plannerRuntime.ts#L36-L75) to verify cleanups only execute if their generation matches the active session. This successfully prevents dangling references.
2. **Closure Scope Hygiene:** Memory scope structures inside hooks and custom hooks release internal object closures correctly on teardown.

#### Citations
- Registry generation counter: [plannerRuntime.ts](file:///e:/16062026/features/planner/canvas-fabric/plannerRuntime.ts#L36-L75)

#### Recommendations
- Audit future zustand subscriptions or window trackers to ensure they do not store raw canvas DOM node references or Fabric object instances, as caching these elements in React states can block standard garbage collection paths.
