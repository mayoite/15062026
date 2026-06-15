# Live Route Classification

*Created: 2026-06-10*

This file classifies the live route surface from the actual `app/` tree and
compares it to `project/route-contract.json`.

## Status Labels

- `canonical` = intended live route
- `compatibility` = legacy alias, redirect, or overlapping entrypoint
- `broken` = live route with current type/import/runtime problems
- `dead-doc-only` = appears in docs/contracts but does not exist as a live route

## Canonical Surfaces

### Public Site

- `/` -> `app/(site)/page.tsx`
- `/access` -> `app/(site)/access/page.tsx`
- `/choose-product` -> `app/(site)/choose-product/page.tsx`
- `/dashboard` -> `app/(site)/dashboard/page.tsx`
- `/about`, `/contact`, `/products/**`, `/projects`, `/solutions/**`, `/service`, `/showrooms`, `/sustainability`, and other marketing routes under `app/(site)/**`

Notes:
- `app/(site)` is the canonical public web surface.
- `dashboard` is a protected member route, not a planner-owned route.

### Oando Planner

- `/oando-planner` -> redirect to `/oando-planner/canvas`
- `/oando-planner/canvas` -> canonical member-capable editor route
- `/oando-planner/guest` -> canonical guest route
- `/oando-planner/login` -> canonical planner login
- `/oando-planner/onboarding` -> canonical onboarding route

Evidence:
- `app/oando-planner/page.tsx`
- `app/oando-planner/canvas/page.tsx`
- `app/oando-planner/guest/page.tsx`
- `app/oando-planner/login/page.tsx`
- `app/oando-planner/onboarding/page.tsx`

### Buddy Planner

- `/buddy-planner` -> current live landing/editor shell
- `/buddy-planner/guest` -> canonical guest route
- `/buddy-planner/login` -> canonical login
- `/buddy-planner/editor` -> current live protected editor route

Evidence:
- `app/buddy-planner/page.tsx`
- `app/buddy-planner/guest/page.tsx`
- `app/buddy-planner/login/page.tsx`
- `app/buddy-planner/editor/page.tsx`

### Admin / CRM / Ops

- `/admin/**` -> live admin surface
- `/crm/**` -> live CRM surface
- `/ops/customer-queries` -> live ops surface

Evidence:
- `app/admin/**`
- `app/crm/**`
- `app/ops/**`

### API

- `/api/theme/active`
- `/api/planner/ai-advisor`
- `/api/admin/**`
- other routes under `app/api/**`

## Compatibility Routes

### Buddy Planner Compatibility Layer

- `/buddy-planner/[...slug]` -> live catch-all compatibility shell
- `/buddy-planner/dashboard` -> redirect to `/dashboard`
- planner identity docs still point to `/t/:teamSlug/o/:officeSlug/map`

Evidence:
- `app/buddy-planner/[...slug]/page.tsx`
- `app/buddy-planner/dashboard/page.tsx`
- `features/oando-planner/model/plannerIdentity.ts`
- `project/route-contract.json`

Notes:
- The live Next route surface uses `/buddy-planner/**`.
- Tenant-style `/t/:teamSlug/o/:officeSlug/map` still survives as contract/history language, not as a live `app/` route.

### Oando Planner Compatibility Layer

- `/oando-planner/dashboard` -> redirect to `/dashboard`
- `/oando-planner/shared` -> extra shell route that does not look canonical

Evidence:
- `app/oando-planner/dashboard/page.tsx`
- `app/oando-planner/shared/page.tsx`

Notes:
- `/oando-planner/shared` loads `SmartdrawPlannerShell` and currently looks like a placeholder or experimental shell, not the main planner route.

## Broken Routes

The original static blockers in this file have been repaired:

- `/portal/[id]` type contract mismatch fixed
- `/api/admin/**` helper import path drift fixed
- `/api/planner/ai-advisor` missing export path fixed

Current runtime-facing breakage is narrower:

### Oando Planner Canvas Is Still Functionally Placeholder

- `/oando-planner/canvas/` -> `app/oando-planner/canvas/page.tsx`

Why:
- the route now serves `200` and the hydration mismatch in `EditorTopBar` was fixed by stabilizing `useOnlineStatus()`
- however the visible 2D workspace is still effectively blank
- `features/oando-planner/ui/OandoPlannerPage.tsx` currently routes through `SharedThree2DEngine` and a placeholder `TestBlock`, while `usePlannerPageState` and the richer planner canvas paths are not actually wired into that page

### Canonical Redirect Has One Extra Hop

- `/oando-planner/`

Why:
- the redirect page now points to `/oando-planner/canvas/`, but runtime still shows a redirect chain because `trailingSlash` is enabled globally

### Buddy Planner Was Blank But Is Now Seeded

- `/buddy-planner/editor/`

Current state:
- the page now mounts with a starter template and catalog clicks add real shapes to the tldraw canvas
- the route is no longer just an empty shell, though deeper inspector/state integration is still incomplete

## Dead-Doc-Only Routes

- `/api/planner/save`
- `/api/planner/load`
- `/material-studio`
- `/buddy-planner/t/:teamSlug/o/:officeSlug`
- `/buddy-planner/t/:teamSlug/o/:officeSlug/map`

Evidence:
- present in `project/route-contract.json`
- no matching live `app/` routes

## Contract Mismatches

### `project/route-contract.json`

Current mismatches:

1. `configurator.workspaceBase` and `workspaceMap` are not live `app/` routes.
2. `_status: "not-implemented"` for Buddy is stale because `/buddy-planner`, `/buddy-planner/guest`, and `/buddy-planner/editor` do exist.
3. `api.planner.save` and `api.planner.load` are declared but not implemented in `app/api/`.
4. `materialStudio` is declared but not implemented.
5. Redirect notes still describe old configurator workspace compatibility rather than the current flat route surface.

## Recommended Repair Order

1. Finish the Oando canvas recovery by replacing the placeholder `SharedThree2DEngine` path with the real planner canvas/state flow.
2. Keep `project/route-contract.json` aligned with the live route tree and protected-route redirects.
3. Decide whether `/oando-planner/shared` and `/buddy-planner/[...slug]` stay as compatibility routes or get retired later.
4. After Oando runtime behavior is real, continue with planner/page UI cleanup.
