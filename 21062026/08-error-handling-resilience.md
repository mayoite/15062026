# Error Handling and Resilience Audit Report

**Audit Path:** `21062026/08-error-handling-resilience.md`  
**Date:** June 21, 2026  
**Auditor:** Agent 3 (Security & Resilience Specialist)  

---

## Executive Scorecard

| Parameter | Description | Score (1-10) | Status |
|---|---|---|---|
| **36** | React Error Boundary coverage and recovery behavior | 8.0/10 | Good |
| **37** | Application logging, diagnostic collection, error ingestion | 3.0/10 | Needs Improvement |
| **38** | PWA offline support and synchronization (sync queue, offline storage) | 4.0/10 | Needs Improvement |
| **39** | Outage/maintenance behavior, downstream error propagation, user messaging | 8.0/10 | Good |
| **40** | Internet connectivity status monitoring and dynamic feature toggles | 1.0/10 | Missing |

**Overall Error Handling & Resilience Score:** **4.8 / 10**

---

## Detailed Audit Findings & Recommendations

### Parameter 36: React Error Boundary Coverage & Recovery
**Score:** 8.0 / 10

#### Findings
- **Planner Layout Protection:** The application implements a customized, client-side React Error Boundary [PlannerErrorBoundary](file:///e:/16062026/features/planner/editor/PlannerErrorBoundary.tsx) wrapping the children of the planner route in [layout.tsx](file:///e:/16062026/app/planner/layout.tsx#L38).
- **Graceful Recovery Screen:** If a Javascript or WebGL crash occurs in the canvas, the boundary catches the exception, displays an informative recovery card ("Planner unavailable. Something went wrong rendering this surface. Your plan data is safe."), showing the error message, and displays a "Try again" button to reset the state and reload the canvas.
- **Global Layout Gap:** The global site page layout [app/\(site\)/layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx) lacks any error boundary wrapper. Any unhandled UI error in marketing or product pages will crash the entire route, producing a blank screen for site visitors.
- **WebGL Granularity Gap:** The boundary is configured at the layout level. If WebGL context creation fails or crashes inside the 3D Viewer, the entire 2D drawing canvas is taken down as well, rather than just displaying a local fallback for the 3D element.

#### Citations
- Error boundary wrapper: [layout.tsx](file:///e:/16062026/app/planner/layout.tsx#L38)
- Error boundary implementation: [PlannerErrorBoundary.tsx](file:///e:/16062026/features/planner/editor/PlannerErrorBoundary.tsx)
- Global site layout (lacks boundary): [layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx)

#### Recommendations
- Add a global error boundary to the root site layout [app/\(site\)/layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx) to prevent unexpected marketing page failures from showing white-screens.
- Wrap WebGL/Three.js viewers (such as `ThreeViewer` or `Planner3DViewer`) in localized boundaries. This ensures that graphics-specific context crashes only disable the 3D configurator panel while leaving the 2D layout canvas fully operational.

---

### Parameter 37: Application Logging & Error Ingestion
**Score:** 3.0 / 10

#### Findings
- **Console-Only Logging:** Server routes and client catches utilize console log statements (`console.log`, `console.error`) to print stack traces and messages. While server logs are aggregated by hosting providers, client logs exist only in browser consoles.
- **No Remote Telemetry:** The application lacks integration with remote error tracking services (like Sentry, Logflare, or a local server-side ingestion API).
- **Silent Client Failures:** When the [PlannerErrorBoundary](file:///e:/16062026/features/planner/editor/PlannerErrorBoundary.tsx#L32-L34) catches a client-side component crash, it prints to `console.error` but is unable to transmit the diagnostic data to the development team, leaving the engineers blind to user-facing exceptions in production.

#### Citations
- Localized error printing: [PlannerErrorBoundary.tsx](file:///e:/16062026/features/planner/editor/PlannerErrorBoundary.tsx#L32-L34)
- Audit log endpoint (not for errors): [app/api/audit/route.ts](file:///e:/16062026/app/api/audit/route.ts)

#### Recommendations
- Configure a client-side error logging integration (e.g. Sentry) or implement a simple client-error route (e.g. `/api/log-error`) that receives client stack traces.
- Inside `PlannerErrorBoundary.componentDidCatch`, call the ingestion service to record user tracebacks automatically.

---

### Parameter 38: PWA Offline Support & Storage Sync
**Score:** 4.0 / 10

#### Findings
- **Service Worker Presence:** A service worker `/sw.js` is registered in production via [ServiceWorkerRegister.tsx](file:///e:/16062026/components/pwa/ServiceWorkerRegister.tsx). It handles network-first navigation caching and cache-first assets loading, displaying a fallback page [page.tsx](file:///e:/16062026/app/offline/page.tsx) when offline.
- **Offline Storage Schema:** The codebase has a robust IndexedDB manager [offlineStorage.ts](file:///e:/16062026/features/planner/store/offlineStorage.ts) and batch queue retry processor [syncQueueProcessor.ts](file:///e:/16062026/features/planner/store/syncQueueProcessor.ts) to manage plan updates offline and synchronize them when online.
- **Dead Integration Gap:** The IndexedDB storage layer and the sync processor are **completely dead/unused** in the active workspace. The workspace canvas persistence logic relies entirely on `localStorage` drafts via [plannerDraft.ts](file:///e:/16062026/features/planner/persistence/plannerDraft.ts) which lacks automated network-recovery sync, offline conflict resolution, and transactional retry support.

#### Citations
- Service Worker handler: [sw.js](file:///e:/16062026/public/sw.js)
- Unused IndexedDB store: [offlineStorage.ts](file:///e:/16062026/features/planner/store/offlineStorage.ts)
- Unused sync manager: [syncQueueProcessor.ts](file:///e:/16062026/features/planner/store/syncQueueProcessor.ts)
- Active client storage: [plannerDraft.ts](file:///e:/16062026/features/planner/persistence/plannerDraft.ts)

#### Recommendations
- Replace the primitive `localStorage` drafts with the IndexedDB manager `offlineStorage.ts` inside the active workspace handler [usePlannerSessionHandlers.ts](file:///e:/16062026/features/planner/editor/usePlannerSessionHandlers.ts).
- Instantiate `SyncQueueProcessor` inside the client application wrapper to automatically process queued modifications when connectivity returns.

---

### Parameter 39: Outage Behavior & Error Propagation
**Score:** 8.0 / 10

#### Findings
- **Database Connection Safety Check:** Critical API routes check database connectivity configuration using [isPlannerDatabaseConfigured](file:///e:/16062026/features/planner/store/plannerPersistence.ts#L247-L249). If the connection string is missing or invalid, routes gracefully degrade and return source configurations (e.g. `source: "unconfigured"`) instead of crashing the process.
- **Downstream Session Failure Catching:** Client data fetch operations (e.g., in [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts#L218-L230)) intercept connection issues and report user-friendly warnings in the toolbar rather than breaking user controls.

#### Citations
- DB configuration checker: [plannerPersistence.ts](file:///e:/16062026/features/planner/store/plannerPersistence.ts#L247-L249)
- Graceful API degradation: [app/api/admin/plans/route.ts](file:///e:/16062026/app/api/admin/plans/route.ts#L28-L34)
- Client-side error state handling: [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts#L218-L230)

#### Recommendations
- Implement a global maintenance banner at the shell layout level that triggers if downstream database queries fail, informing users of service outages.
- Provide clear instructions on how users can download their currently loaded layout as a JSON file to prevent loss of work during write outages.

---

### Parameter 40: Internet Connectivity Status Monitoring
**Score:** 1.0 / 10

#### Findings
- **No Connection Listeners:** The application does not monitor the browser's connectivity state. It lacks any event listener for the `online` / `offline` events of the `window` object or check of the `navigator.onLine` parameter.
- **No Offline Feature Toggles:** If a user loses internet connectivity, there is no toolbar indicator warning them of the condition. Dynamic cloud-related buttons (such as "Save to Cloud" or "Share") remain active. A user attempting to click them will experience unexplained request timeouts or raw errors rather than receiving an early warning with suggestions to use local-fallback options.

#### Citations
- Absence of `navigator.onLine` or connection listeners: [usePlannerSessionHandlers.ts](file:///e:/16062026/features/planner/editor/usePlannerSessionHandlers.ts)
- Absence of client connection listeners: [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts)

#### Recommendations
- Add a custom `useOnlineStatus` hook monitoring connection state via `navigator.onLine` and window listeners.
- Render a warning banner in the planner header when offline.
- Dynamically disable cloud-save buttons when offline, highlighting the "Export JSON" and "Save Local Draft" features as safe offline alternatives.
