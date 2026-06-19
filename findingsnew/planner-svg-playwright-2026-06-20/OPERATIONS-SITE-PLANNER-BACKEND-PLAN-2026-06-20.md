# Operations, Site, Planner, and Backend Plan

Date: 2026-06-20
Scope: entire site, with highest priority on planner workflow and backend hardening
Format: 7 parts, 49 action points

This plan converts the current audit into a delivery sequence. The target is not a vague "perfect backend"; it is a backend that meets world-class standards with measurable proof across authorization, validation, queueing, persistence, observability, recovery, and release gates. Special attention is required on planner SVG generation and export, especially the active paths around `features/planner/ai/LayoutPreviewSvg.tsx`, `features/planner/lib/plannerSvgExportColors.ts`, catalog SVG previews, and the final planner export flow. Changes to protected areas such as `app/api/`, auth/session behavior, database schema, `proxy.ts`, `platform/`, `project/`, and top-level structure still require explicit approval before implementation.

## Part 1. Stabilize the release baseline

1. Freeze the active execution scope to one planner surface: `app/planner/` plus `features/planner/`, with no revived legacy editor paths.
2. Create one route inventory for the full site and mark each route as `keep`, `upgrade`, `redirect`, or `retire`.
3. Create one ship board with owner, status, blocker, acceptance proof, and rollback note for every section and subsystem.
4. Fix all currently known critical issues before feature expansion, especially admin authorization trust and planner save-state loss.
5. Define one definition of done for every shipped slice: user-visible outcome, test proof, metrics check, and rollback path.
6. Split delivery into vertical slices that can ship independently: site shell, catalog flow, planner flow, account flow, admin/ops flow, backend hardening.
7. Require daily evidence snapshots: passing commands, route proof, planner workflow proof, and unresolved risk list.

## Part 2. Repair the end-to-end user workflow

8. Standardize the primary journey as `landing -> browse -> product -> planner -> save/export -> enquiry/order handoff`.
9. Reduce every section to one primary CTA and one fallback CTA so users never face conflicting next steps.
10. Centralize route metadata, nav labels, breadcrumbs, footer links, and CTA destinations to prevent route drift.
11. Define a shared section contract for headings, spacing, loading, empty, error, and mobile behavior across the site.
12. Upgrade sections in commercial order: homepage and nav first, then catalog, then planner entry/workspace, then contact/enquiry, then account/dashboard.
13. Standardize content operations as `draft -> review -> asset check -> preview -> publish -> rollback`.
14. Add cross-route tests for guest and signed-in flows so the full journey can be verified after each release slice.

## Part 3. Make the planner workflow shippable

15. Define the only valid planner journey as `/planner -> project setup -> draw/import room -> place products -> inspect in 2D/3D -> save/export/share`.
16. Make Fabric the sole active 2D editor contract and remove or null-gate legacy editor dependencies from routed planner UI.
17. Push every planner mutation through one pipeline: `mutate -> saveState -> revision event`.
18. Drive autosave, SVG export, AI extraction, analytics, and 3D sync from the canonical revision signal rather than history length or secondary heuristics.
19. Define one canonical object schema with stable UUID, `catalogId`, dimensions, transform, elevation, and model reference for round-trip persistence.
20. Hide or complete all dead planner controls, including blueprint, AI actions, templates, inspector actions, toolbar buttons, and any export action that is not producing a trustworthy artifact.
21. Gate planner release on user proof for insert, move, rotate, duplicate, delete, undo/redo, save/load, import failure handling, SVG preview/export fidelity, and 2D/3D parity.

## Part 4. Fix planner geometry, persistence, and 3D sync

22. Correct Fabric-to-scene conversion so scaled, rotated, and center-origin objects map accurately into world space.
23. Stop deriving 3D from a default room rectangle and extend the scene contract to walls, openings, zones, and room geometry.
24. Make catalog-aware 3D the default and keep 2D export aligned with the same canonical item identity: use real model assets when present and explicit box fallback only when no model is available.
25. Ensure SKU identity, orientation, dimensions, placement, and vector representation survive the full chain of catalog placement, save/load, SVG export, and 3D render.
26. Make 2D, 3D, and split view subscribe to the same canonical scene so edits appear across views in one update cycle.
27. Separate rolling local drafts from named cloud plans and define deterministic precedence rules for `?id=` hydration and stale IndexedDB recovery.
28. Tie save status to real IndexedDB or cloud completion so `Saved` appears only after successful persistence and `Error` appears on failure with retry.

## Part 5. Harden the backend to a near-perfect standard

29. Remove all authorization decisions based on client-controlled metadata such as `user_metadata.role`; use only server-owned claims or authoritative membership data.
30. Centralize authz guards for admin, tenant, and object-level access so every protected action uses the same enforcement path.
31. Add strict request schemas and bounded payload rules for all mutation endpoints, with sanitized errors and no silent field acceptance.
32. Enforce ownership, idempotency, optimistic version checks, and transactional writes for plan, audit, CRM, catalog, and feature mutations.
33. Treat SVG, model, AI, HTML-bearing, and asset-fetch inputs as untrusted; enforce strict schemas, allowlist sanitization, origin controls, MIME plus magic-byte checks, and rejection of unsafe nodes, URLs, scripts, and event handlers.
34. Move export and render workloads into isolated, non-privileged, asynchronous jobs with idempotency keys, bounded resources, no ambient credentials, controlled storage, and authenticated status and download APIs.
35. Add append-only audit events, structured logs, health checks, alerts, backup/restore drills, rollback runbooks, adversarial export fixtures, and fuzz tests before claiming backend readiness.

## Part 6. Upgrade every site section without ownership drift

36. Keep route files thin and move business logic into the owning feature or shared library instead of spreading section logic across routes.
37. Standardize catalog taxonomy, naming, dimensions, imagery, alt text, and fallback rules so catalog, product pages, search, planner, and BOQ agree.
38. Unify product-to-planner handoff so every supported SKU can open the planner with consistent prefill and attribution.
39. Upgrade enquiry, contact, and account flows so each one reflects planner state, saved projects, and customer intent instead of acting as isolated forms.
40. Review admin and ops surfaces for duplicate controls, weak trust boundaries, stale labels, and missing status feedback.
41. Add route-level error boundaries and explicit empty states to every major section so failures degrade predictably rather than silently.
42. Validate performance, accessibility, and mobile usability across homepage, catalog, planner, account, and admin before each release slice.

## Part 7. Build the operating system for shipping

43. Split validation into fast gates and release gates: fast for `typecheck`, touched lint, and targeted tests; release for planner flow, navigation flow, accessibility, and production smoke checks.
44. Replace stale or archived planner test assumptions with active Fabric and 3D tests that match the current shipped architecture.
45. Add deterministic tests for planner mutation history, persistence round-trips, geometry conversion, import rollback, and cloud freshness precedence.
46. Add end-to-end browser coverage for the main revenue flow and the main planner flow in 2D, 3D, and split modes.
47. Define release metrics and stop-ship thresholds for auth failures, save failures, import failures, route errors, console errors, and AI spend anomalies.
48. Require post-release checks after every deployment: navigation, key forms, planner save/load, cloud reopen, export, and admin access control.
49. Run the whole program as three waves: stabilize critical trust and planner correctness, ship section upgrades and cloud workflow, then harden release operations and observability.

## Recommended execution order

1. Critical auth and trust-boundary fixes
2. Planner mutation, persistence, and geometry correctness
3. 2D/3D scene unification and catalog-aware rendering
4. Site-wide route and workflow cleanup
5. Cloud save/load, account, enquiry, and ops integration
6. Full validation, observability, and release hardening

## Success criteria

- No route has dead controls or ambiguous next actions.
- Planner edits are immediately undoable, persist correctly, and stay in sync across 2D, 3D, and split view.
- Backend authorization does not trust client-controlled role claims.
- Planner SVG preview and final SVG export are deterministic, sanitized, bounds-correct, and visually aligned with the canonical scene.
- Save, load, export, import, and audit flows have deterministic failure behavior and evidence-backed test coverage.
- Every major site section has a clear owner, release gate, and rollback path.

## SVG priority checks

- Use one canonical SVG pipeline so live preview, download, rasterization, and PDF embedding do not diverge.
- Export from a cloned or serialized planner scene, not by mutating the live canvas during export.
- Resolve theme tokens to concrete colors so no final SVG ships with unresolved `var()` or `color-mix()` output.
- Sanitize all SVG markup and generated labels before preview, storage, or download.
- Add golden tests for transformed bounds, rotated objects, crop safety, XML validity, and screenshot parity against the planner scene.
