# Site workflow — start here

*One reading order for assets, databases, and ops. Topic files below stay short; this page avoids repeating them.*

---

## Read in this order

| Step | File | You learn |
|------|------|-----------|
| 1 | [`README.md`](README.md) | One-sentence stack: Supabase paths + R2 bytes + local mirror |
| 2 | [`database.md`](database.md) | **Three databases**, env vars, verify commands, audits |
| 3 | [`backend.md`](backend.md) | R2, path normalization, upload policy (not DB topology) |
| 4 | [`folders.md`](folders.md) | `public/cdn/` vs `asset-cdn/` |
| 5 | [`operations.md`](operations.md) | Upload scripts, bucket names, deploy checklist |
| 6 | Role-specific | [`site.md`](site.md) marketing · [`planner.md`](planner.md) canvas |

**Live ops** (milestones, breakages): [`../Handover.md`](../Handover.md) · [`../Failures.md`](../Failures.md)

**Full index**: [`../DOC-MAP.md`](../DOC-MAP.md) · **npm scripts**: [`../SCRIPTS.md`](../SCRIPTS.md)

---

## Daily commands

```bash
npm.cmd run db:test
npm.cmd run audit:supabase:catalog
npm.cmd run audit:supabase:admin
npm.cmd run assets:cdn:upload
```

Catalog data fixes: `alt:sync:apply` · `supabase:backfill:images` — see [`database.md`](database.md) § Catalog data quality.

---

## What not to duplicate

| Topic | Canonical doc | Do not copy into |
|-------|---------------|------------------|
| DB topology + verify | [`database.md`](database.md) | `backend.md`, `Handover.md` |
| Upload / R2 ops | [`operations.md`](operations.md) | `site.md`, `planner.md` |
| Audit snapshots | `results/audits/*.md` | `workflow/` topic files |
| npm script list | [`../SCRIPTS.md`](../SCRIPTS.md) | `operations.md` (summaries only) |

`docs/CDN-ARCHITECTURE.md` is a **redirect** only — content lives in this folder.