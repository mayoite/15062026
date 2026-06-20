# Oando unified planner + marketing site

Flat-root Next.js app. Furniture company site at `oando.co.in` with one workspace planner at `/planner`.

**Canonical repo:** `E:\16062026` (commit/push here).

**Current status (2026-06-20):** Production readiness 8.0/10. All critical security, legacy auth, and i18n infrastructure work complete.

### Completed (2026-06-20)
- ✅ Security hardening (XSS sanitization, CSRF protection)
- ✅ Appwrite fully removed, auth migrated to Supabase
- ✅ i18n infrastructure (next-intl, 5 locales: en, hi, fr, de, es)
- ✅ Architecture documentation + OpenAPI spec
- ✅ Tech stack documentation site (`tech-stack-docs/`)
- ✅ Planner runtime fixes (wall drag, SVG export, Three.js)

### Active code
`features/planner/` + `app/planner/`. Fabric canvas + 3D (r3f) integration.

## Root markdown

| File | Role |
|------|------|
| `Readme.md` | Orientation (this file) |
| `AGENTS.md` | Agent rules |

## Layout

`app/` · `features/planner/` · `components/` · `lib/` · `tests/` · `scripts/` · `platform/` · `config/` · `results/` · `findingsnew/`

Historical cleanup now lives in git history and `findingsnew/`. Dev stays on the canvas replacement.

## CSS

- **Base:** `app/css/base/` for global primitives such as `animations.css`.
- **Tokens:** `app/css/core/tokens/theme.css` is the single source; no hex in components.
- **Entry:** `globals.css` -> `app/css/index.css` (base + foundation + `core/chrome` shell).
- **Site:** `app/css/core/site/bundles/*` per layout.
- **Planner:** `app/css/core/planner/bundles/*` for workspace styling.

See `docs/CSS-ARCHITECTURE.md` for the full import map.

## Assets & CDN

| Layer | Location | Deployed? |
|-------|----------|-----------|
| App SDKs (tldraw, model-viewer, Draco) | `public/cdn/` | Yes (small, in git) |
| Catalog images + 3D | R2 bucket `oando-asset-cdn` | Cloud only |
| Local mirror + upload source | `asset-cdn/` | No (gitignored) |
| Path strings | Supabase | DB only |

```bash
npm.cmd run assets:cdn:upload
node scripts/count-r2-objects.mjs oando-asset-cdn
```

Asset and CDN workflow: `docs/workflow/README.md`.

## Planner delivery loop

1. Define acceptance evidence
2. Smallest complete increment
3. Test -> critique -> revise -> retest

No feature is done without verification.

## Commands (PowerShell)

```bash
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run test:planner
npm.cmd run test:e2e:nav
npm.cmd run release:gate
```

**TypeScript:** stay on **6.x** (`^6.0.3`). Root `tsconfig.json` extends `config/build/tsconfig.json` and owns path aliases.

**Build:** production build generates ~341 static pages when typecheck passes.

## Docs

- **Architecture:** `docs/architecture/` (system overview, component architecture, data flow, deployment)
- **API:** `docs/api/openapi.yaml` (OpenAPI 3.0 spec)
- **Tech Stack Site:** `tech-stack-docs/` (Vite + React mini-site, run with `npm.cmd run dev` in that dir)
- **Audit:** `comprehensive-audit-2026-06-20/` (8 audit reports + executive summary)

Everything else is code or generated evidence under `results/`.
