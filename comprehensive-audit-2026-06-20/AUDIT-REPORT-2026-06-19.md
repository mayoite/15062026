# Oando Platform Comprehensive Audit — 2026-06-19

## Executive summary

The application is not release-ready. The audit found **2 critical, 11 high, 14 medium, and 1 low** issues. The immediate blockers are an admin privilege-escalation path and a Fabric insertion path that does not reliably update history, persistence, exports, metrics, or 3D state.

The Fabric replacement is active on the workspace route and TypeScript passes, but important advertised workflows remain incomplete: cloud save, AI apply/match, blueprint calibration, templates, inspector mutation, accurate 2D→3D geometry, and catalog-model rendering.

## Scope and evidence

Reviewed active `app/`, `features/`, `components/`, `lib/`, configuration, dependencies, tests, and public assets. Protected paths were inspected only. No application code, configuration, database, or auth behavior was changed.

Validation evidence:

- `npm.cmd run typecheck`: **PASS**.
- `npm.cmd run lint`: **PASS**.
- Targeted Fabric bridge/autosave/AI tests: **PASS** — 4 files, 10 tests.
- The planner gate enumerates 913 tests and did not complete within the audit window; an aggregate validation run timed out after 184 seconds. It is not counted as a pass.
- `npm.cmd audit --omit=dev --json`: **5 production vulnerabilities** (3 high, 2 moderate).
- Only `.env.example` is tracked; no live hard-coded secret was found in active source.

## Critical findings

### C-01 — Admin privilege escalation through user-controlled metadata

**Evidence:** `app/api/admin/_lib/server.ts:71` and `app/api/admin/features/route.ts:43` accept `user.user_metadata.role` when `app_metadata.role` is absent. Supabase user metadata is user-editable.

**Impact:** An authenticated user can claim an admin role and reach service-role-backed admin operations, including sensitive reads and catalog, plan, theme, or feature mutations.

**Required fix:** Authorize only through immutable server-owned claims (`app_metadata`) or a database membership/role table. Remove every `user_metadata` authorization fallback, centralize the guard, and add forged-metadata regression tests.

### C-02 — Fabric insertions are not committed to document state

**Evidence:** `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:690-797` adds catalog/AI objects without calling `saveState()`; the API exposes this insertion path at line 1376. `features/planner/editor/PlannerWorkspace.tsx:272-280` refreshes its serialized draft only when history-array lengths change.

**Impact:** Newly inserted furniture can appear on screen while 3D, metrics, autosave, export, and the planner document remain stale. Closing immediately can lose the placement.

**Required fix:** Commit one history revision after every successful insertion and publish an explicit canvas revision event. Test immediate insert→3D, insert→export, insert→autosave, undo, and reload.

## High findings

### H-01 — 2D→3D geometry is wrong for scaled and center-origin objects

`features/planner/lib/fabricDocumentBridge.ts:52-65` ignores `scaleX`/`scaleY` and treats `left`/`top` as a top-left origin. Inserted furniture uses centered origins at `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:756-760`. Objects are shifted by half their footprint and scaling is lost. Serialize canonical center/size metadata or derive transformed Fabric bounds.

### H-02 — AI match/apply actions are permanently gated by a legacy editor

`features/planner/editor/PlannerLeftPanel.tsx:74-77,173` passes a null editor. `features/planner/ai/AIAssistDrawer.tsx:163-167,296-300,380-387` disables or exits AI actions on that null value even though Fabric bridges exist. Gate on Fabric runtime availability and remove the legacy editor dependency.

### H-03 — Blueprint workflow is presented but not integrated with Fabric

`features/planner/editor/BlueprintPanel.tsx:79-95,381-397,501-509` offers import, calibration, and movement instructions, but the workspace never mounts the needed canvas renderer/capture integration. `BlueprintMoveCapture.tsx` and `CalibrationCapture.tsx` explicitly identify themselves as Fabric-era stubs. Wire an underlay layer and pointer capture or hide the feature.

### H-04 — Authenticated cloud save is hard-disabled

`app/planner/(workspace)/canvas/page.tsx:11-18` detects the user, but `features/planner/editor/PlannerWorkspace.tsx:1029-1040` always passes `isAuthenticated={false}` and replaces save with an error. Pass authenticated state and connect the existing cloud API flows.

### H-05 — Explicit cloud-plan URLs can restore stale IndexedDB data

`features/planner/persistence/cloudPlanHydration.ts:25-27` skips fetching when any local entry exists; `features/planner/editor/PlannerWorkspace.tsx:481-486` restores it. A `?id=` URL can therefore ignore a newer cloud revision. Fetch/compare timestamps or force cloud hydration for explicit IDs.

### H-06 — Import reports success before asynchronous loading finishes

`features/planner/lib/fabricDocumentBridge.ts:145-152` fire-and-forgets `importDraft` and returns `true`; `features/planner/editor/PlannerWorkspace.tsx:460-474` immediately announces success. Return `Promise<boolean>`, await the import, and preserve the old canvas/name on failure.

### H-07 — Autosave status is timer-based rather than transaction-based

`features/planner/hooks/usePlannerFabricAutosave.ts:36-43` marks the plan saved after 5.2 seconds. `features/planner/persistence/persistence.ts:300-329` provides no completion/error callback and does not catch IndexedDB rejection. Drive UI state from the actual write result and expose retryable errors.

### H-08 — Persistent XSS in product model markup

`app/(site)/products/[category]/[product]/ProductViewer.tsx:111-117,568-582` interpolates catalog-derived display names and model paths into `dangerouslySetInnerHTML` attributes without escaping. `proxy.ts:103-110` permits inline script. Render the custom element safely through JSX/property assignment, allowlist asset URLs, and tighten CSP.

### H-09 — Vulnerable production dependency chain

`package.json:115,122,131` includes unexplained, unused generic packages `audit@0.0.6` and `fix@0.0.6`; `fix` pulls vulnerable `underscore@1.1.6` and `underscore.string@1.1.4`, while `next@16.2.9` embeds vulnerable `postcss@8.4.31`. Verify provenance, remove the unused packages, upgrade/override Next/PostCSS to supported patched versions, and rerun the production audit. Do not follow npm's incompatible Next 9 downgrade suggestion.

### H-10 — Cross-tenant audit-log spoofing

`app/api/audit/route.ts:23-31,41-53` authenticates a user but trusts caller-supplied `team_id`; `lib/audit/auditRepository.ts:13-21` inserts it without membership validation. Derive team identity from authorized server context, validate membership, allowlist actions/types, and bound metadata size/depth.

### H-11 — Planner regression gate is too broad and currently unverified

`package.json:26` defines `vitest run planner`; listing it took 32.1 seconds and enumerated 913 tests. The aggregate validation run exceeded 184 seconds without a planner result. Split a fast Fabric/3D replacement gate from the full regression suite, retain the full suite for CI/nightly, and obtain an isolated full-run result before release.

## Medium findings

### M-01 — 3D is a box-shell preview, not catalog-model integration

`features/planner/3d/types.ts:28-36` has no catalog/model reference; `features/planner/3d/Planner3DViewer.tsx:255-280` renders every product as boxes; `PlannerWorkspace.tsx:261-270` drops catalog identity. Persist catalog/model references and load GLTF with a box fallback.

### M-02 — 3D ignores actual Fabric walls, doors, and windows

`features/planner/lib/fabricDocumentBridge.ts:43-50` maps only furniture and the viewer hard-renders a rectangular shell at `features/planner/3d/Planner3DViewer.tsx:211-251`. Extend the canonical document with wall/opening geometry and generate the room mesh from it.

### M-03 — Rotation is neither persisted nor undoable

`features/planner/canvas-fabric/hooks/floorplanCanvas.ts:990-1018` mutates and renders rotation without `saveState()`. Commit a revision after rotation and cover autosave/export/undo.

### M-04 — Inspector mutation controls are no-ops

`features/planner/editor/shapeInspectorBridge.ts:41-55` exposes explicit no-op edit, delete, and duplicate handlers. Connect these actions to Fabric mutation APIs with history commits or remove the controls.

### M-05 — Legacy editor surface remains in the active tree

`features/planner/shared/types/legacyEditorStub.ts`, `features/planner/lib/editorTools.ts`, and `features/planner/ui/LayersPanel.tsx` retain TL-style contracts and tests. Prove route bundles no longer import them, then remove/archive the surface and adapt tests. Stale `.pw-tldraw-container` selectors also remain in planner CSS.

### M-06 — Placement IDs are unstable

`features/planner/lib/fabricDocumentBridge.ts:51,59` generates IDs from array indexes. Reordering/deleting changes identity and resets 3D scene/camera memory. Persist UUIDs on Fabric objects.

### M-07 — Rate limiting is non-atomic and bypassable

`lib/rateLimit.ts:90-120` uses separate select/upsert operations; concurrent requests can share a count. Its fallback map at lines 17-38 never evicts keys and is instance-local. Use an atomic datastore operation with expiry and server-trusted identity/IP keys.

### M-08 — Anonymous AI endpoint permits cost and body-size abuse

`app/api/ai-assist/route.ts:27-30,49-65` accepts anonymous, unbounded messages—including client system messages—before calling paid providers. Require entitlement/authentication, cap body/message/token sizes, discard client system prompts, and enforce provider timeout/spend quotas.

### M-09 — App Router has no project error boundaries

No `error.tsx`, `global-error.tsx`, or application ErrorBoundary was found. Add global and route-level boundaries plus a planner recovery/reset surface that protects local drafts and records telemetry.

### M-10 — Tracked font files contain HTML, not WOFF2 data

Files including `public/fonts/helvetica-neue/helveticaneue-light.woff2`, bold, and italic variants begin with `<!DOCTYPE html>`; the light file is 450,932 bytes. Replace them from a verified licensed source and add a CI magic-byte check for `wOF2`.

### M-11 — Test TypeScript is excluded from typecheck

`tsconfig.json:50-54` excludes all test/spec files, while ordinary Vitest execution transpiles rather than type-checking the test project. Add `tsconfig.tests.json` and `typecheck:tests`, or enable Vitest type checking.

### M-12 — Test inventory describes removed tldraw suites and invalid commands

`tests/INVENTORY.md:5,95,159-187` lists removed tldraw tests and tells maintainers to use a deleted docs-sync workflow. Archive/delete the inventory or regenerate it from the active Fabric suite.

### M-13 — Vitest resolves an alias into archived state

`vitest.config.ts:13` and `vitest.site.config.ts:13` map `@/stores` to `archive/state/state`. Tests can therefore pass against archived behavior. Identify consumers and repoint them to active state or remove the alias and obsolete tests.

### M-14 — Coverage commands do not isolate their named suites

`package.json:23` runs the global test config for `test:coverage:planner`; `vitest.config.ts:21-39` only narrows measured source, not executed tests. The site config repeats the pattern at `vitest.site.config.ts:21-48`. Use explicit project/include configs so planner and site coverage run their intended suites once.

## Low finding

### L-01 — Stale coverage comment references a deleted plan

`vitest.site.config.ts:33` references deleted `plans/SITE-COVERAGE.md`. Remove or replace it with current executable configuration guidance.

## Additional incomplete-product evidence

These reinforce the release assessment but are covered by the findings above:

- `features/planner/editor/PlannerWorkspace.tsx:436-439`: applying a template only reports “not yet available.”
- `features/planner/canvas-fabric/FabricCanvasWorkspace.tsx:97-105`: visible Select All, Fit Selection, and Lock Selection buttons have no handlers.
- `features/planner/editor/PlannerWorkspace.tsx:975`: snap status is hard-coded to `Pending`.
- `features/planner/editor/chrome/PlannerChromeHost.tsx:5`: chrome host is an intentional no-op during replacement.
- `features/planner/editor/PlannerHistoryControls.tsx:23-32`: history controls are statically disabled.
- `Readme.md:34,50,66,78`: current repo guidance links to archived/nonexistent `docs/` and `plans/` paths and still describes tldraw CDN assets as active.

## Recommended remediation order

1. Close C-01 immediately; invalidate sessions if role claims may have been forged and review admin audit history.
2. Close C-02, H-01, M-03, and M-06 as one canonical Fabric revision/identity/geometry change.
3. Fix H-08 and H-10, then dependency vulnerabilities H-09.
4. Restore trustworthy persistence: H-05, H-06, H-07, then authenticated cloud save H-04.
5. Either complete or temporarily hide AI, blueprint, templates, inspector, and nonfunctional layer/history controls.
6. Complete wall/opening and catalog-model 3D mapping.
7. Add integration tests that assert canvas→document→autosave/export→reload→3D consistency; passing unit bridges currently do not cover this chain.

## Release gate

Do not release until both critical issues and all security high issues are closed, the full lint/typecheck/test/build gate passes, and browser tests prove immediate insertion persistence plus accurate 2D/3D synchronization.
