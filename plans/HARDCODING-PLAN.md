# Hardcoding remediation — step plan (00–06)

*Execution · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Inventory: [`docs/HARDCODING-INVENTORY.md`](../docs/HARDCODING-INVENTORY.md)*

## Goal

Remove or justify live-repo hardcoding (P0–P4 in the inventory) without breaking planner geometry, catalog ingest, or release gates.

**Out of scope:** `data/site/*` copy, Vitest fixtures, coverage thresholds (OK per inventory).

---

## Step overview

| Step | Name | Severity | Status | Depends on |
|------|------|----------|--------|------------|
| **00** | Baseline & inventory | — | **Done** | — |
| **01** | Secrets & tokens | P0 | Open | 00 |
| **02** | Infra & URL fallbacks | P1 | Open | 01 |
| **03** | Script path repair | P4 | **Done** (REPO step 04) | 00 |
| **04** | Planner units & geometry | P2 | Open | `PLANNER-COVERAGE-75` Slice D |
| **05** | CSS & color tokens | P3 | Open | `CSS-ARCHITECTURE` Phase 5 |
| **06** | Legacy routes (`proxy.ts`) | P4 | **Done** (REPO step 05) | Approval was given in REPO batch |

**Run order:** `00` → `01` → `02` → `03` (then `04`–`06` in parallel with coverage where noted).

```
00 ──► 01 ──► 02
 │
 └──► 03
       │
       ├──► 04 (after planner Slice D tests)
       ├──► 05 (CSS Phase 5)
       └──► 06 (approval gate)
```

---

## Policy

| Topic | Rule |
|-------|------|
| Inventory | `docs/HARDCODING-INVENTORY.md` — update after each step |
| Secrets | Never commit `.env.local` |
| `proxy.ts` | Step **06** only with approval (`AGENTS.md`) |
| Geometry | One module for cm/mm — tests required before refactors |
| CSS | `app/css` tokens — no new hex / `neutral-*` |
| Proof | `npm run test` + `lint` + `typecheck` every PR |

---

# Step 00 — Baseline & inventory

**Status: Done (2026-06-15)**

| # | Action | Status |
|---|--------|--------|
| 00.1 | Scan live tree for P0–P4 hardcoding | Done |
| 00.2 | Write `docs/HARDCODING-INVENTORY.md` | Done |
| 00.3 | Write this step plan (`plans/HARDCODING-PLAN.md`) | Done |
| 00.4 | Link from `docs/DOC-MAP.md` + `plans/CONTENTS.md` | Done |

**Done when:** inventory + plan exist and are linked. ✓

---

# Step 01 — Secrets & tokens (P0)

**Ops + light doc PR.** No app logic unless token validation hardening.

| # | Action |
|---|--------|
| 01.1 | Rotate `ADMIN_TOKEN` + `CUSTOMER_QUERIES_ADMIN_TOKEN` in `.env.local` / hosting (≥32 random chars) |
| 01.2 | Remove commented real `#APPWRITE_DEV_SECRET_KEY=…` from `.env.local` |
| 01.3 | Confirm Appwrite key rotated if ever in committed history (`security-audit.md`) |
| 01.4 | Redact live secret fragments from `results/audits/security-audit.md` (keep remediation text) |
| 01.5 | Optional: `scripts/validate-launch-env.mjs` — warn on trivial admin tokens locally |

**Acceptance**

- [ ] No real secrets in committed files (`secretlint` + grep)
- [ ] `app/api/customer-queries/manage` works with new token locally
- [ ] Tick P0 row in `docs/Handover.md`

**PR:** `H-PR01` — `security-audit.md`, optional `validate-launch-env.mjs`

---

# Step 02 — Infra & URL fallbacks (P1)

| # | Action |
|---|--------|
| 02.1 | `scripts/seed_direct.ts` — parse `PRODUCTS_DATABASE_URL`; remove hardcoded `postgres.erpweaiypimorcunaimz` |
| 02.2 | `scripts/fix_and_reseed.ts` — same |
| 02.3 | `app/api/filter/route.ts` + `app/api/generate-alt/route.ts` — `HTTP-Referer` from `@/lib/siteUrl` |
| 02.4 | `app/api/admin/themes/publish/route.ts` — fail loud when R2 keys missing in production |
| 02.5 | Document `lib/siteUrl.ts` Vercel-preview fallback in `docs/SCRIPTS.md` |

**Acceptance**

- [ ] `rg "erpweaiypimorcunaimz" scripts/` → **0**
- [ ] `npm run typecheck` pass
- [ ] Seed scripts run with `PRODUCTS_DATABASE_URL` set

**PR:** `H-PR02` — seed scripts, API routes, docs

---

# Step 03 — Script path repair (P4)

**Same work as `REPO-STRUCTURE-PLAN` Phase 3.** Can run in parallel with Step 01–02.

| # | Script | Action |
|---|--------|--------|
| 03.1 | `scripts/audit-quality-gate.mjs` | Point presets at `lib/theme/presets.ts` or archive |
| 03.2 | `scripts/catalog-preview.ts` | Import `@/lib/catalog/blocks2d` + `@/lib/catalog/types` |
| 03.3 | `scripts/generate-tree.js` | Folder map: `lib/`, `features/` — drop `packages/` |
| 03.4 | `scripts/prepare-review-folders.js` | Rewrite to flat-root paths |
| 03.5 | Update `docs/SCRIPTS.md` for any command changes | |

**Acceptance**

- [ ] `rg "packages/" scripts/ -l` → **0** (or archived under `archive/scripts/`)
- [ ] Each script runs or is archived with a one-line README

**PR:** `H-PR03` — four scripts + `docs/SCRIPTS.md`

---

# Step 04 — Planner units & geometry (P2)

**Start after** `plans/PLANNER-COVERAGE-75.md` Slice D tests `lib/measurements` + `catalogBlockBridge`.

| # | Action |
|---|--------|
| 04.1 | Add `features/planner/lib/plannerUnits.ts` — canvas cm ↔ mm, legacy `≥1000` normalize |
| 04.2 | Replace `* 10` in `measurements.ts`, `documentBridge.ts`, `exportActions.ts`, `buildBoq.ts` |
| 04.3 | `ZoneOverlayTool`, `RoomDetectionTool` — use helpers; extend geometry tests |
| 04.4 | Wire `wallDimensionUnit` where ShapeUtil still assumes mm/m |
| 04.5 | Document conversion contract in module header + `docs/TESTING.md` |

**Acceptance**

- [ ] Vitest: `planner-geometry`, `planner-lib-measurements` green; edge cases `999` / `1000` / `1200`
- [ ] Smoke: place furniture → export BOQ → reload — no size regression
- [ ] Update `docs/Failures.md` cosmetic row if fixed

**PR:** `H-PR04` — `plannerUnits.ts`, tools, tests

---

# Step 05 — CSS & color tokens (P3)

**Overlaps `docs/CSS-ARCHITECTURE.md` Phase 5.** Three sub-steps.

### 05-A — Site surfaces

| # | File | Action |
|---|------|--------|
| 05.A1 | `features/site-assistant/UnifiedAssistant.tsx` | `neutral-*` → design tokens |
| 05.A2 | `features/site-assistant/AdvancedBot.tsx` | Same |
| 05.A3 | `features/ops/CustomerQueriesOpsPageView.tsx` | Same |
| 05.A4 | `components/support/VisualIVR.tsx` | Tokens; dedupe contacts to `data/site/support.ts` |
| 05.A5 | `components/ProductGallery.tsx` | Tokenize thumb borders |
| 05.A6 | `features/shared/auth/components/AuthControls.tsx` | Align with auth token classes |

### 05-B — Planner 3D / export

| # | File | Action |
|---|------|--------|
| 05.B1 | `features/planner/viewer/viewerMaterials.ts` | `VIEWER_PALETTE` → CSS vars / `FOCSS_3D_COLORS` |
| 05.B2 | `features/planner/lib/finishVariants.ts` | `colorHex` from token keys |
| 05.B3 | `features/planner/3d/types.ts` | Category colors from shared palette |
| 05.B4 | `features/planner/lib/vectorPdfExport.ts` | Token-derived RGB |

### 05-C — FilterGrid structure

| # | File | Action |
|---|------|--------|
| 05.C1 | `app/(site)/products/[category]/FilterGrid.tsx` | Split hooks + subcomponents (~1,473 lines) — no behavior change |

**Acceptance**

- [ ] `rg "neutral-[0-9]" features/site-assistant features/ops components/support --glob "*.tsx"` → **0**
- [ ] Visual check: `/`, assistant, `/products`, ops view
- [ ] Inventory P3 counts updated

**PRs:** `H-PR05a` (05-A) · `H-PR05b` (05-B) · `H-PR05c` (05-C)

---

# Step 06 — Legacy routes & IndexedDB (P4)

**Requires explicit approval** — edits `proxy.ts`.

| # | Action |
|---|--------|
| 06.1 | Audit `config/build/next.config.js` 301s vs `proxy.ts` allowlist |
| 06.2 | Remove redundant legacy paths from `proxy.ts` if redirects cover them |
| 06.3 | Keep `plannerIdentity.ts` compat strings until old URL traffic is zero |
| 06.4 | **Do not rename** `buddy-planner-db` IndexedDB without migration — document as permanent compat |

**Acceptance**

- [ ] Playwright: `navigation-smoke`, `planner-guest-workspace`, `planner-catalog` green
- [ ] `/buddy-planner/guest`, `/oando-planner/canvas` bookmarks still work

**PR:** `H-PR06` — `proxy.ts` (after approval)

---

## PR stack (00–06)

| PR | Step | Deliverable |
|----|------|-------------|
| — | 00 | Inventory + plan (done) |
| H-PR01 | 01 | Secrets hygiene |
| H-PR02 | 02 | Seed scripts + API URL helpers |
| H-PR03 | 03 | `packages/` script repair |
| H-PR04 | 04 | `plannerUnits` + geometry tests |
| H-PR05a/b/c | 05 | CSS tokens + FilterGrid split |
| H-PR06 | 06 | `proxy.ts` trim |

Every PR: `npm run test` · `lint` · `typecheck` · refresh inventory summary.

---

## Cross-plan dependencies

| Other plan | Maps to step |
|------------|--------------|
| `REPO-STRUCTURE-PLAN` step **04** | **03** (script paths) |
| `REPO-STRUCTURE-PLAN` step **05** | **06** (`proxy.ts`) |
| `PLANNER-COVERAGE-75` Slice D | gate for **04** |
| `CSS-ARCHITECTURE` Phase 5 | **05** |

Do not merge `lib/catalog` → `features/catalog` until planner coverage T3 progress (`REPO-STRUCTURE-PLAN`).

---

## Verify (per step)

```bash
npm.cmd run lint && npm.cmd run typecheck && npm.cmd run test

# After 02:
rg "erpweaiypimorcunaimz" scripts/

# After 03:
rg "packages/" scripts/ -l

# After 04:
npx vitest run planner-geometry planner-lib-measurements

# After 05:
rg "neutral-[0-9]" features/site-assistant features/ops components/support --glob "*.tsx"
```

**Program done when:** Steps **01–05** acceptance checked; **06** merged or waived in writing; inventory P0–P4 cleared or deferred in `docs/Failures.md`.

---

## See also

- `docs/HARDCODING-INVENTORY.md` — file-level list
- `plans/REPO-STRUCTURE-PLAN.md`
- `plans/COVERAGE-PLAN.md`
- `docs/CSS-ARCHITECTURE.md`
- `results/audits/security-audit.md`