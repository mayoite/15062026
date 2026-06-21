# Failures, Blockers, and Follow-ups

This file documents critical blockers, failed parameters, and required follow-ups identified during repository audits.

## Live Blockers & Failures

### 1. Broken Keyboard Navigation on Canvas (Parameter 9)
- **File:** [floorplanCanvas.ts](file:///e:/16062026/features/planner/canvas-fabric/hooks/floorplanCanvas.ts#L130-L165)
- **Status:** `[!] Blocked`
- **Description:** Keyboard-only shortcuts and canvas manipulations are completely non-functional in modern browsers. The `onKeyDown` listener retrieves `code = event.key || event.keyCode` (resolving to string names like `'Delete'` or `'ArrowLeft'`) but compares them using strict equality `===` to numeric keycode constants (e.g. `46`, `37`, `38`, `39`, `40`).
- **Remediation:** Refactor `onKeyDown` to compare `event.key` to standard string literals:
  ```typescript
  // Replace:
  if (code === 46) deleteOp();
  // With:
  if (event.key === 'Delete' || event.key === 'Backspace') deleteOp();
  ```

### 2. Missing Skip-to-Content Link in Admin Layout (Parameter 7)
- **File:** [app/admin/layout.tsx](file:///e:/16062026/app/admin/layout.tsx)
- **Status:** `[~] In Progress`
- **Description:** The admin route uses the `AdminLayoutShell` component which is currently a stub and has no skip-to-content accessibility link.
- **Remediation:** Add a visible-on-focus skip link matching the pattern used in the site and planner layouts once `AdminLayoutShell` is implemented.

### 3. Missing ARIA Input Label in Catalog search (Parameter 8)
- **File:** [CatalogPanel.tsx](file:///e:/16062026/features/planner/ui/CatalogPanel.tsx#L281)
- **Status:** `[~] In Progress`
- **Description:** The product catalog search input relies solely on a placeholder and lacks an accessibility label for screen readers.
- **Remediation:** Add `aria-label="Search products"` to the `<input>` element.

---

## Performance & UX Follow-ups

### 1. Font Format Compression Optimization (Parameter 12)
- **File:** [fonts.ts](file:///e:/16062026/lib/fonts.ts)
- **Description:** Several weights of Helvetica Neue use `.otf` format and Cisco Sans uses `.ttf` formats. These are uncompressed compared to `.woff2` files, leading to slower page load times.
- **Action:** Convert local font assets to WOFF2 and update paths in `fonts.ts`.

## Security & Resilience Audits Follow-ups (Parameters 31-40)

### 1. HTML Attribute Injection XSS in Product Viewer (Parameter 31)
- **File:** [ProductViewer.tsx](file:///e:/16062026/app/%28site%29/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx#L570-L584)
- **Status:** `[!] Vulnerable`
- **Description:** Double quotes or other attribute breakers in product display names are interpolated directly into the raw HTML `<model-viewer>` string rendered via `dangerouslySetInnerHTML`.
- **Action:** Escape model attributes or transition to rendering `<model-viewer>` as a standard React custom element.

### 2. Unused CSRF Protection on Mutating Endpoints (Parameter 32)
- **File:** [csrf.ts](file:///e:/16062026/lib/security/csrf.ts)
- **Status:** `[!] Vulnerable`
- **Description:** Double-submit cookie CSRF validation utilities exist but are never executed in any route handlers or middleware.
- **Action:** Incorporate `validateCsrfRequest(req)` validation check inside mutating API handlers (e.g. `plans/route.ts`).

### 3. API Routes Excluded from Edge Security Headers (Parameter 35)
- **File:** [proxy.ts](file:///e:/16062026/proxy.ts#L138-L153)
- **Status:** `[~] Open`
- **Description:** The edge proxy's middleware route matcher completely excludes `/api/` paths, exposing API responses to lacking CSP, frame-injection, or MIME-sniffing protection headers.
- **Action:** Update middleware matching strategy or inject headers into API responses.

### 4. Unused IndexedDB Storage & Sync Queue (Parameter 38)
- **File:** [offlineStorage.ts](file:///e:/16062026/features/planner/store/offlineStorage.ts) and [syncQueueProcessor.ts](file:///e:/16062026/features/planner/store/syncQueueProcessor.ts)
- **Status:** `[~] Open`
- **Description:** IndexedDB offline storage layer and batch queue sync processor are written but completely unused in client planner handlers.
- **Action:** Integrate offline storage manager into save and load handlers.

### 5. Missing Internet Connectivity Monitoring (Parameter 40)
- **File:** [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts)
- **Status:** `[~] Open`
- **Description:** No navigator online/offline event listeners or status checks exist in client controllers.
- **Action:** Implement a `useOnlineStatus` hook and display status warnings in the planner toolbar.
