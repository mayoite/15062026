# Phase 7 — Cross-Cutting Quality

## Goal

Close accessibility, responsive, performance, memory, resilience, security, and internationalization gaps across the complete guest flow. No new features; raise the quality bar on existing behavior.

---

## Performance targets to define before claiming passes

The following budgets must be measured on the target device (document hardware, browser, OS, network) before they can be claimed as passed. Approximate starting targets:

| Metric | Target | Measurement method |
|---|---|---|
| Workspace interactive (TTI after hydration) | < 2.5 s | Playwright `page.waitForSelector('[data-testid="planner-fabric-ready"]')` |
| Fabric canvas ready (first render) | < 1.5 s after workspace mount | `performance.mark` in `FloorplanProvider` |
| Catalog panel visible | < 500 ms after tab click | Playwright timing |
| 3D scene first frame | < 3 s after switching to 3D | `data-render-evidence` attribute timing |
| 100-object interaction latency | < 50 ms per operation | Vitest micro-benchmark |

These are initial targets. Adjust based on measured baseline in P7-08.

---

## Memory / leak requirements

The following must show zero monotonic growth across 5 repeated cycles:

| Resource | How to measure |
|---|---|
| Fabric canvas event listeners | `view._events` key count before and after each mount/unmount |
| Window event listeners | DevTools → Event Listeners panel; or `getEventListeners(window)` count |
| Three.js render loop | `renderer.info.programs.length` before and after 3D mount/unmount |
| Object URLs | Track `URL.createObjectURL` calls minus `URL.revokeObjectURL` calls in a test |
| IndexedDB connections | Count open connections; confirm closed on unmount |

---

## Task checklist

### Accessibility
- [ ] **P7-01 Keyboard traversal:** complete the full guest workflow (setup → draw → place → inspect → review → export) without touching a pointer. Tab order must be logical; no keyboard trap outside modal dialogs.
- [ ] **P7-02 Focus management:** every modal sets focus on open; traps focus while open; returns focus to trigger on close. Escape closes modal. No visible content is hidden from keyboard traversal.
- [x] **P7-03 Accessible names and states:** tool rail buttons now include the keyboard shortcut in their accessible name (`aria-label={tool.shortcut ? \`\${tool.label} (\${tool.shortcut})\` : tool.label}`). Layer toggles already expose `aria-pressed`. Save status already uses `role="status"` and `aria-live="polite"`.
- [x] **P7-04 Canvas screen-reader alternative:** `FabricCanvasWorkspace` section now has `role="application"`, a dynamic `aria-label` describing the number of objects, and a visually hidden `aria-live="polite"` region that announces selection changes to screen readers.
- [~] **P7-05 Visual access:** (a/b/d) need E2E/manual validation; (c) CSS `prefers-reduced-motion: reduce` guard added to `planner-shell.css` to disable transitions on all `pw-*` animated shell elements (already present in `editor-chrome.css` for `pwx-*`).
- [ ] **P7-06 Axe scans:** run `axe-playwright` (or equivalent) with the following states open: setup gate, empty workspace, workspace with 3 objects selected, catalog panel, blueprint panel, export modal, session dialog, 3D view. Assert zero critical or serious violations.

### Responsive
- [ ] **P7-07 Responsive matrix:** test at `320×568`, `390×844`, `768×1024` (tablet portrait), `1024×768` (tablet landscape), `1280×720`, `1440×900`. At each viewport: (a) no horizontal scroll; (b) no primary action hidden; (c) canvas occupies ≥ 50% viewport height; (d) touch targets ≥ 44 px.
- [ ] **P7-08 Touch input:** drag to place furniture, tap to select, two-finger scroll on canvas (if supported), mobile dock opens, virtual keyboard doesn't obscure submit fields, orientation change doesn't crash or lose data.

### Performance
- [ ] **P7-09 Performance baseline:** attach a Performance Observer in a Playwright test and measure the 5 metrics from the table above. Record results in `plannerplan/PERFORMANCE-BASELINE.md`. Do not claim a budget passes until the baseline is measured.
- [x] **P7-10 Lazy loading:** `Planner3DViewer` static import in `PlannerWorkspace.tsx` replaced with `next/dynamic` using `ssr: false`. Three.js and its dependencies are now excluded from the initial bundle and lazy-loaded only when the 3D view mounts.
- [ ] **P7-11 Scale test:** use the `handleInsert` API to place 100 objects programmatically. Assert: (a) canvas renders without error; (b) undo/redo cycle 10× without corruption; (c) total interaction time for 100 selections < 5 s; (d) `exportDraft()` completes in < 500 ms.

### Memory
- [ ] **P7-12 Listener leak check:** mount `PlannerWorkspace` → interact → unmount. Assert `window` event listener count is the same before and after. Repeat 5×. Implement using a spy on `window.addEventListener` / `window.removeEventListener`.
- [ ] **P7-13 3D resource leak:** mount `Planner3DViewer` → switch to 3D → switch back to 2D → unmount. Assert `renderer.info.programs.length === 0` after unmount. Repeat 3×.
- [x] **P7-14 Blueprint URL leak:** (From P4-14) Blueprint uses base64 data URLs (`FileReader.readAsDataURL` / `pdfPageToDataUrl`) — no `URL.createObjectURL` is called, so no `revokeObjectURL` is needed or possible. Marked N/A.

### Resilience and security
- [ ] **P7-15 Offline mid-session:** open workspace, place an object, disable network (DevTools → Offline), continue editing, re-enable network. Assert autosave recovers and the object is persisted.
- [ ] **P7-16 Error boundaries:** simulate a React render error inside `PlannerWorkspace` using a test-only prop. Assert `PlannerErrorBoundary` catches it, shows a recovery UI, and does NOT lose the current IndexedDB draft.
- [ ] **P7-17 Security:** (a) import a JSON file containing `<script>` in a string field; assert it is sanitized before rendering; (b) assert no guest document content appears in `console.log` or `console.warn` output; (c) run `npm.cmd audit --audit-level=high`; assert zero high-severity advisories.

### i18n
- [ ] **P7-18 String extraction:** identify all hardcoded English strings in the planner UI that are user-visible (buttons, labels, placeholders, error messages, status messages). Minimum scope: `PlannerTopBar`, `PlannerStepBar`, `PlannerWorkflowPanel`, `ExportModal`, `PlannerSessionDialog`. Extract each to `messages/en.json` under the `planner` namespace using `useTranslations('planner')`. Do not change behavior.
- [ ] **P7-19 Translation test:** run the workspace with `locale=hi` and `locale=de`. Assert: (a) no untranslated key identifiers are visible; (b) long German compound words do not cause layout overflow at `1280×720`.

---

## Minimum quality thresholds (all must pass before Phase 8)

- Zero critical/serious axe violations in all 8 mandatory states.
- Zero unexplained console errors; all warnings documented with owner and decision.
- No horizontal page scroll at any required viewport.
- No monotonic listener or GPU-resource growth across 5 repeated lifecycle loops.
- `three` and `fabric` are in async chunks, not the initial bundle.
- `npm.cmd run typecheck` and `npm.cmd run lint` pass with zero errors.

---

## Primary files

- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/editor/PlannerToolRail.tsx`
- `features/planner/editor/PlannerStatusBar.tsx`
- `features/planner/catalog/` (catalog card accessible names)
- `features/planner/3d/Planner3DViewer.tsx`
- `app/planner/` (route-level dynamic imports)
- `messages/en.json` (i18n extraction target)
- `tests/e2e/planner-a11y.spec.ts` ← create if absent

---

## Required tests

- `npm.cmd run test:a11y` — axe scan for 8 mandatory states.
- Listener-count test for `PlannerWorkspace` mount/unmount cycle.
- 3D resource-count test for `Planner3DViewer` mount/unmount cycle.
- Blueprint URL revocation unit test.
- Offline mid-session E2E.
- Error boundary E2E with recovery assertion.
- Security: sanitized import string test.
- i18n: `hi` and `de` locale layout tests.
- Performance baseline measurements recorded.

---

## Exit gate

Full planner remains usable with keyboard, touch, mobile layout, reduced motion, offline/storage failures, and long sessions. Zero critical axe violations. No proven resource leaks. `three` and `fabric` lazy-loaded. Minimum planner strings extracted for i18n.
