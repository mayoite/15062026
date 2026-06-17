# Hardcoding inventory (live repo)

*Created: 2026-06-15. Scan scope: `app/`, `components/`, `features/`, `lib/`, `data/`, `scripts/`, `platform/`, `proxy.ts` — excludes `archive/` unless noted.*

**Purpose:** Single map of **intentional literals** vs **debt to remove**. Not every literal is wrong (brand emails, test fixtures). Items are tagged by severity.

| Severity | Meaning |
|----------|---------|
| **P0** | Secrets, credentials, or infra IDs in committed source |
| **P1** | Production fallbacks that hide missing env or leak hostnames |
| **P2** | Magic numbers / legacy compatibility affecting correctness |
| **P3** | CSS / color / layout not on design tokens |
| **P4** | Stale paths, dead scripts, legacy route lists |
| **OK** | Intentional — content data, test fixtures, conversion constants with tests |

**Related:** **`plans/HARDCODING-PLAN.md`** (execution plan) · `docs/CSS-ARCHITECTURE.md` (Phase 5 sweep) · `results/audits/security-audit.md` (some rows **stale** — see below) · `plans/REPO-STRUCTURE-PLAN.md` (archived) Phase 2–4 · `docs/Failures.md` (geometry reload cosmetic)

---

## Summary

| Category | Severity | Count (approx) | Top locations |
|----------|----------|----------------|---------------|
| Local env secrets | P0 | 2+ keys | `.env.local` (gitignored — **never commit**) |
| Committed secret residue | P0 | 1 | Commented Appwrite key in `.env.local`; audit excerpt in `security-audit.md` |
| Infra IDs in scripts | P1 | 2 files | `scripts/seed_direct.ts`, `scripts/fix_and_reseed.ts` |
| URL / domain fallbacks | P1 | 4+ | `lib/siteUrl.ts`, API `HTTP-Referer` fallbacks |
| Planner unit / `* 10` math | P2 | 15+ files | `plannerCanvasUnits`, `measurements.ts`, tldraw tools |
| 3D / export hex colors | P3 | 4 files | `viewerMaterials.ts`, `finishVariants.ts`, `3d/types.ts` |
| Tailwind `neutral-*` (live) | P3 | 4 components + 2 features | `site-assistant`, `ops`, `VisualIVR`, `ProductGallery` |
| Legacy planner routes | P4 | 2 files | `proxy.ts`, `plannerIdentity.ts` |
| Dead `packages/` script paths | P4 | 4 scripts | `plans/REPO-STRUCTURE-PLAN.md` (archived) Phase 3 |
| Marketing / contact copy | OK | `data/site/*` | Emails, phone — product content |
| Vitest fixtures | OK | `tests/planner-store-*.test.ts` | Deterministic UUIDs, sample projects |

---

## P0 — Secrets & credentials

| Location | What | Remediation |
|----------|------|-------------|
| `.env.local` | `DATABASE_URL`, Supabase URLs, DB passwords, `ADMIN_TOKEN`, commented `#APPWRITE_DEV_SECRET_KEY=…` | Keep gitignored; rotate weak admin tokens; remove commented real secret from local file |
| `.env.example` | Placeholder-only (`your-secret-here`) | **OK** — do not paste real values |
| `results/audits/security-audit.md` | Documents old `.env.example` leak | Rotate Appwrite if ever committed; redact audit excerpt if republishing |

**Fixed (audit stale):** `platform/drizzle/db.ts` no longer falls back to hardcoded Supabase URL — throws if `NEXT_PUBLIC_SUPABASE_URL` / anon key missing.

---

## P1 — Infrastructure & env fallbacks

| File | Hardcoded value | Notes |
|------|-----------------|-------|
| `scripts/seed_direct.ts` | `username: 'postgres.erpweaiypimorcunaimz'` | Supabase pooler project id — read from `PRODUCTS_DATABASE_URL` instead |
| `scripts/fix_and_reseed.ts` | Same username | Same fix |
| `lib/siteUrl.ts` | Fallback `"https://oando.co.in"` when env missing or Vercel preview | Acceptable prod default; document for preview deploys |
| `app/api/filter/route.ts` | `HTTP-Referer` fallback `https://oando.co.in` | Use `SITE_URL` helper |
| `app/api/generate-alt/route.ts` | Same | Same |
| `app/api/admin/themes/publish/route.ts` | R2 bucket default `"oando-themes"`, empty-string fallbacks for keys | Fail loud in prod if unset |
| `scripts/audit-hosted-runtime.mjs` | `DEFAULT_BASE_URL = "https://workingoando.vercel.app"` | Script-only; override via env arg |

---

## P2 — Planner geometry & unit magic numbers

Legacy canvas uses **cm on canvas** with `× 10` bridges to mm in many paths. `plannerCanvasUnits()` in `features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge.ts` normalizes values `≥ 1000` (legacy ×10 bug) — see `docs/Failures.md` cosmetic reload issue.

| File | Pattern | Risk |
|------|---------|------|
| `catalogBlockBridge.ts` | `value >= 1000 → value / 10`; `normalizeCatalogMm = * 10` | Core conversion — needs tests when changing |
| `features/planner/lib/measurements.ts` | `bounds.w * 10`, `length * 10` | Label/display units |
| `features/planner/lib/documentBridge.ts` | `* 10`, `* 1000` by unit | Export / document bridge |
| `features/planner/editor/exportActions.ts` | `plannerCanvasUnits(...) * 10` | BOQ/export dimensions |
| `features/planner/shared/boq/buildBoq.ts` | `(widthCm ?? 60) * 10` default furniture size | Default 60×60×75 cm |
| `features/planner/tldraw/tools/ZoneOverlayTool.ts` | `(maxX - minX) * 10` for `widthMm` | Room/zone creation |
| `features/planner/tldraw/tools/RoomDetectionTool.ts` | `* 10`, `* 1000` perimeter | Auto room detect |
| `features/planner/ui/InspectorPanel.tsx` | `sqm * 10.7639` | sqft conversion constant — OK if documented |
| `features/planner/model/plannerDocument.ts` | cm/m → mm `* 10` / `* 1000` | Unit conversion — tested in model tests |

**Backlog:** ShapeUtil / `wallDimensionUnit` not fully wired — archive `08-GEOMETRY-STATUS.md`, `docs/Failures.md`.

---

## P3 — CSS, colors & UI literals

### Design-token policy

Live styling should flow through `app/css/` tokens (`docs/CSS-ARCHITECTURE.md` Phase 5). **In progress.**

| File | Issue |
|------|-------|
| `features/planner/viewer/viewerMaterials.ts` | Large `VIEWER_PALETTE` hex map (~20 colors) — candidate for FOCSS 3D tokens |
| `features/planner/lib/finishVariants.ts` | `colorHex: "#…"` per finish swatch |
| `features/planner/3d/types.ts` | Category → hex (`#4b5563`, `#8d6b4f`, …) |
| `features/planner/lib/vectorPdfExport.ts` | `rgb(0.1, 0.1, 0.1)` etc. |
| `features/site-assistant/UnifiedAssistant.tsx` | **53** `neutral-*` Tailwind classes |
| `features/site-assistant/AdvancedBot.tsx` | **54** `neutral-*` |
| `features/ops/CustomerQueriesOpsPageView.tsx` | **25** `neutral-*` |
| `components/support/VisualIVR.tsx` | **15** `neutral-*` + hardcoded phone/email in tree |
| `components/ProductGallery.tsx` | **3** `neutral-*` |
| `features/shared/auth/components/AuthControls.tsx` | Inline `gray-*` / `dark:bg-gray-900` in class string |

### Improved / watch

| File | Notes |
|------|-------|
| `app/(site)/products/[category]/FilterGrid.tsx` | **~1,473 lines** — no `neutral-*` / hex in file (2026-06-15); still a structural split candidate (`docs/Failures.md` FilterGrid) |
| `features/planner/editor/ExportModal.tsx` | Comment: colors from FOCSS tokens — verify at runtime |

### Layout `style={{}}` (often OK)

Dynamic positioning in planner canvas (`PlannerCanvas.tsx`, overlays, 3D `Html`) — geometry-driven, not theme debt.

---

## P4 — Legacy routes, IDs & stale scripts

| File | What |
|------|------|
| `proxy.ts` | Long allowlist: `/buddy-planner/*`, `/oando-planner/*`, `/planner/*` — Phase 4 trim if `next.config` 301s suffice (**needs approval** per `AGENTS.md`) |
| `features/planner/model/plannerIdentity.ts` | Compatibility path arrays for old planner URLs |
| `features/planner/persistence/persistence.ts` | `LEGACY_DB_NAME = "buddy-planner-db"` (IndexedDB) |
| `scripts/audit-quality-gate.mjs` | `packages/lib/theme/presets.ts` — path dead |
| `scripts/catalog-preview.ts` | Imports from `packages/lib/catalog/*` |
| `scripts/generate-tree.js` | Documents `packages/` tree |
| `scripts/prepare-review-folders.js` | Many `packages/lib/*` paths |

---

## OK — Intentional literals (not debt)

| Area | Examples |
|------|----------|
| `data/site/*.ts` | `sales@oando.co.in`, phone numbers, route copy |
| `data/site/assistant.ts` | UI placeholder strings |
| `lib/catalog/seed/*` | Catalog seed dimensions and SKUs |
| `features/planner/lib/finishVariants.ts` | Product finish names (hex is P3, names OK) |
| `tests/planner-store-*.test.ts` | `plan-uuid-1`, `HQ Layout`, `planner-project-*` keys |
| `vitest.config.ts` / `vitest.site.config.ts` | Coverage threshold numbers (policy, not app config) |
| `features/planner/persistence/plannerDraft.ts` | `PLANNER_DRAFT_TTL_MS = 24h` |
| `features/planner/editor/blueprintImport.ts` | `BLUEPRINT_MAX_BYTES = 8 MiB` |

---

## Suggested fix order

See **`plans/HARDCODING-PLAN.md`** steps **00–06**:

| Step | Focus |
|------|--------|
| 00 | Baseline & inventory (done) |
| 01 | P0 secrets & tokens |
| 02 | P1 infra & URL fallbacks |
| 03 | P4 `packages/` script repair |
| 04 | P2 planner units & geometry |
| 05 | P3 CSS & color tokens |
| 06 | P4 `proxy.ts` legacy routes (approval) |

---

## Refresh this doc

```bash
# Examples — re-run ripgrep counts after changes
rg "neutral-[0-9]" --glob "*.{tsx,ts}" --glob "!archive/**" -c
rg "postgres\\.erpweaiypimorcunaimz" --glob "*.{ts,js,mjs}"
rg "packages/" scripts/ -l
wc -l "app/(site)/products/[category]/FilterGrid.tsx"
```

Tick progress in `docs/Handover.md` / `docs/Failures.md` when an item is fixed — do not grow a “fixed” wall here.

---

## See also

- `plans/HARDCODING-PLAN.md` — phased remediation (H1–H6)
- `docs/DOC-MAP.md` — doc index
- `docs/CSS-ARCHITECTURE.md` — token architecture
- `plans/REPO-STRUCTURE-PLAN.md` (archived) — Phases 2–4 overlap
- `results/audits/security-audit.md` — historical P0 list (verify before acting)