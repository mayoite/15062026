# 02 — Start Rules

*Read and complete this checklist before every work batch. No exceptions.*

---

## 1. Orient (5 min)

- [ ] Read `04-HANDOVER.md` — confirm you understand current operator state
- [ ] Read `07-FAILURES-AND-RISKS.md` — confirm no open blocker on your target item
- [ ] Read `05-EXECUTION-CHECKLIST.md` — identify the exact item(s) you will work on
- [ ] Read the acceptance evidence named on that checklist row before writing code

---

## 2. Environment (first session or after pull)

- [ ] `npm install` completed (or confirmed `node_modules` present)
- [ ] `.env.local` present; run `npm run launch:env` if touching auth, DB, or deploy paths
- [ ] Dev server not required for unit work; required for E2E and screenshots

---

## 3. Baseline (every batch — paste output to `results/` or handover)

Run in order. If any step fails, log in `07-FAILURES-AND-RISKS.md` and fix or scope down before proceeding.

```bash
npm run typecheck
npm run lint
npm run test:planner
```

- [ ] Typecheck: 0 errors (or failures logged with file list)
- [ ] Lint: 0 errors, 0 warnings (`--max-warnings=0`)
- [ ] Planner tests: all green (record count, e.g. `79 passed`)

For site or API work, also run:

```bash
npm run test:unit
npm run test:e2e:nav
```

- [ ] Unit tests green (if touched `tests/unit/` or shared `lib/`)
- [ ] Nav smoke green (if touched routes, nav, or layout)

---

## 4. Scope lock

- [ ] **One batch = one checklist item** (or explicitly linked sub-items in the same pillar wave)
- [ ] No drive-by refactors outside the item's file list
- [ ] No new dependencies without a one-line justification in the handover
- [ ] No competitor names, symbols, or screenshots on any Oando surface
- [ ] Cut list respected — do not start: DWG import, photo-to-floorplan CV, AR/WebXR, team tenancy, IT network config, full audit log (`01-MASTER-PLAN.md` §4 cut list)

---

## 5. Ownership map (touch these → know the rules)

| Area | Canonical path | Do not edit |
|---|---|---|
| Planner editor | `features/planner/` + `app/planner/` | `archive/features/oando-planner/`, `archive/features/buddy-planner/` |
| Site marketing | `app/(site)/`, `components/`, `data/site/` | — |
| Catalog data | `lib/catalog/`, Supabase migrations | Duplicate catalog in client bundle |
| Auth | `features/shared/auth/`, Appwrite | Weak static tokens for admin |
| Plans / persistence | `platform/drizzle/`, `app/api/plans/` | Silent dual-write without documented contract |
| Admin / CRM | `app/admin/`, `app/crm/`, `features/crm/` | Unauthenticated write routes |

---

## 6. Hot files (concurrent work)

If multiple agents work in parallel, **rebase before edit** and log conflicts in `07-FAILURES-AND-RISKS.md`:

- `features/planner/planner.css` and related `planner-*.css`
- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/landing/plannerLandingData.ts`
- `config/build/next.config.js`

Prefer one owner per hot file per batch.

---

## 7. File discipline

- [ ] Hand-written `.ts` / `.tsx` / `.css` target **≤ 500 lines** (700 max with written reason in handover)
- [ ] No `@ts-nocheck`, no `ignoreBuildErrors` additions
- [ ] No placeholder UI or dead exports to imply progress
- [ ] Retired code stays under `archive/` — deletion only on explicit instruction

---

## 8. Start sign-off

Before the first line of implementation code:

| Field | Value |
|---|---|
| Date | |
| Operator | |
| Checklist item ID(s) | e.g. `P1-S1.2` |
| Files expected to change | |
| Evidence artifact(s) planned | e.g. `results/audits/security-rerun.md` |
| Baseline typecheck | pass / fail |
| Baseline lint | pass / fail |
| Baseline test:planner | pass / fail / skipped + reason |

Copy the sign-off block into `04-HANDOVER.md` under **Active batch**.

---

## Quick reference — forbidden starts

| Do not start if… | Action |
|---|---|
| Open Severity 0 in `07-FAILURES-AND-RISKS.md` affects your route | Fix S0 first or get explicit waiver |
| Checklist item already `[x]` without evidence you can reproduce | Re-open item; do not assume done |
| You cannot name the evidence artifact | Stop; define acceptance in `05` first |
| Broad refactor with no target state in `01` or `05` | Write target state; get scope approval |
