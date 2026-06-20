# Phase 7 - Cross-Cutting Quality

## Goal

Close accessibility, responsive, performance, resilience, security, and internationalization gaps across the complete guest flow.

## Accessibility

- Keyboard traversal, visible focus, no traps outside modal dialogs, Escape behavior, and focus restoration.
- Accessible names/states for tools, dock widgets, tabs, toggles, canvas alternatives, status, errors, and save feedback.
- Screen-reader workflow for setup, catalog placement, selection, inspector edits, review findings, and export.
- Contrast, zoom to 200%, reduced motion, high contrast, and target size.
- Axe scans for setup, empty canvas, populated canvas, each modal, Split/3D fallback, and mobile drawers.

## Responsive and device input

- 320x568, 390x844, tablet portrait/landscape, 1280x720, 1440x900, and wide desktop.
- Touch placement, drawer interactions, mobile dock, virtual keyboard, safe areas, and orientation change.
- No overlap, clipping, hidden primary action, horizontal page scroll, or inaccessible canvas controls.

## Performance and memory

- First meaningful workspace render, Fabric readiness, catalog load, and 3D readiness budgets.
- Dynamic-load heavy Fabric/Three/AI code only when needed.
- 100 and 500 object interaction tests; pan/zoom and selection latency.
- Repeated 2D/3D switching, modal use, blueprint replacement, and route leave/re-enter leak checks.
- Remove event listeners, subscriptions, object URLs, timers, Fabric instances, Three resources, and workers.

## Resilience, security, and i18n

- Offline startup and mid-session network loss.
- Error boundaries preserve recovery options and current local work.
- Reject unsafe imported content and avoid rendering unsanitized user strings.
- No secrets or guest document data in console output.
- Extract remaining user-facing strings and test long translated labels without layout failure.

## Task checklist

- [ ] **P7-01 Keyboard:** complete setup, catalog, canvas commands, panels, modals, review and export without pointer.
- [ ] **P7-02 Focus:** visible focus, modal containment, Escape, restoration and no hidden focused controls.
- [ ] **P7-03 Semantics:** unique names/states for tools, catalog actions, tabs, status, errors and save feedback.
- [ ] **P7-04 Screen reader:** meaningful nonvisual workflow for canvas state, selection, metrics and findings.
- [ ] **P7-05 Visual access:** contrast, 200% zoom, reduced motion, target size and high-contrast mode.
- [ ] **P7-06 Responsive matrix:** 320x568, 390x844, tablet portrait/landscape, 1280x720, 1440x900 and wide.
- [ ] **P7-07 Touch:** tap, drag, drawers, mobile dock, safe areas, virtual keyboard and orientation.
- [ ] **P7-08 Performance:** record setup, Fabric, catalog and 3D readiness; define and enforce budgets.
- [ ] **P7-09 Scale:** interaction and save latency at 100/500 objects.
- [ ] **P7-10 Memory:** repeat route/view/modal/blueprint cycles and compare listeners, heap and GPU resources.
- [ ] **P7-11 Offline/errors:** route load, mid-session loss, failed assets, storage denial and error boundaries.
- [ ] **P7-12 Security/privacy:** hostile import strings, unsafe URLs, console leakage and dependency/browser warnings.
- [ ] **P7-13 i18n:** extract remaining strings and test Hindi/German-length labels and locale formatting.
- [ ] **P7-14 Cross-browser:** Chromium mandatory; Firefox/WebKit where Fabric/WebGL support allows.

## Minimum quality thresholds

- Zero critical/serious axe violations in mandatory states.
- Zero unexplained console errors; warnings require owner and decision.
- No horizontal page scroll at required viewports.
- No monotonic listener/GPU-resource growth across repeated lifecycle loops.
- Performance budgets must be recorded before they can be claimed as passing.

## Required tests

- `npm.cmd run test:a11y` plus planner-state axe cases.
- Mobile and desktop screenshot matrix.
- Performance measurements with documented hardware/browser.
- Listener/resource count before and after repeated workflow loops.
- Offline, reduced-motion, storage-denied, and error-boundary E2E tests.

## Exit gate

The full planner remains usable with keyboard, touch, mobile layout, reduced motion, offline/storage failures, and long sessions, with no critical axe violations or proven resource leaks.
